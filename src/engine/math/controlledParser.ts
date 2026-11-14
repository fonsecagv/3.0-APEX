// M01 Controlled Equation Parser & Dimensional Analyzer
// Never uses eval() or dynamic Function() execution for external/formula strings.

export type SiDimension = readonly [
  mass: number,      // M (kg)
  length: number,    // L (m)
  time: number,      // T (s)
  current: number,   // I (A)
  temp: number       // Theta (K)
];

export const DIM_DIMENSIONLESS: SiDimension = [0, 0, 0, 0, 0];
export const DIM_MASS: SiDimension = [1, 0, 0, 0, 0];
export const DIM_LENGTH: SiDimension = [0, 1, 0, 0, 0];
export const DIM_TIME: SiDimension = [0, 0, 1, 0, 0];
export const DIM_CURRENT: SiDimension = [0, 0, 0, 1, 0];
export const DIM_TEMP: SiDimension = [0, 0, 0, 0, 1];
export const DIM_VELOCITY: SiDimension = [0, 1, -1, 0, 0];
export const DIM_ACCEL: SiDimension = [0, 1, -2, 0, 0];
export const DIM_FORCE: SiDimension = [1, 1, -2, 0, 0];
export const DIM_PRESSURE: SiDimension = [1, -1, -2, 0, 0];
export const DIM_ENERGY: SiDimension = [1, 2, -2, 0, 0];
export const DIM_POWER: SiDimension = [1, 2, -3, 0, 0];
export const DIM_TORQUE: SiDimension = [1, 2, -2, 0, 0];
export const DIM_DENSITY: SiDimension = [1, -3, 0, 0, 0];
export const DIM_AREA: SiDimension = [0, 2, 0, 0, 0];
export const DIM_MASS_FLOW: SiDimension = [1, 0, -1, 0, 0];
export const DIM_OMEGA: SiDimension = [0, 0, -1, 0, 0];
export const DIM_SPECIFIC_HEAT: SiDimension = [0, 2, -2, 0, -1];
export const DIM_THERMAL_COND: SiDimension = [1, 1, -3, 0, -1];
export const DIM_VOLTAGE: SiDimension = [1, 2, -3, -1, 0];
export const DIM_RESISTANCE: SiDimension = [1, 2, -3, -2, 0];

export function dimensionsEqual(a: SiDimension, b: SiDimension, tol = 1e-9): boolean {
  return a.every((v, idx) => Math.abs(v - b[idx]) <= tol);
}

export function formatDimension(d: SiDimension): string {
  const labels = ['M', 'L', 'T', 'I', 'Θ'];
  const parts = d
    .map((exp, i) => (Math.abs(exp) < 1e-9 ? null : exp === 1 ? labels[i] : `${labels[i]}^${exp}`))
    .filter(Boolean);
  return parts.length > 0 ? parts.join('·') : '1';
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma' };

const SAFE_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  atan: (x) => Math.atan(x),
  sqrt: (x) => {
    if (x < 0) throw new Error('Domain error: sqrt of negative number');
    return Math.sqrt(x);
  },
  abs: (x) => Math.abs(x),
  exp: (x) => Math.exp(x),
  log: (x) => {
    if (x <= 0) throw new Error('Domain error: log of non-positive number');
    return Math.log(x);
  },
  pow: (a, b) => Math.pow(a, b),
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
};

const SAFE_CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
};

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < expr.length && /[0-9.eE]/.test(expr[i])) {
        if ((expr[i] === 'e' || expr[i] === 'E') && (expr[i + 1] === '+' || expr[i + 1] === '-')) {
          numStr += expr[i] + expr[i + 1];
          i += 2;
          continue;
        }
        numStr += expr[i];
        i++;
      }
      const val = Number(numStr);
      if (!Number.isFinite(val)) throw new Error(`Invalid number literal: ${numStr}`);
      tokens.push({ type: 'number', value: val });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      tokens.push({ type: 'ident', value: ident });
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }
    throw new Error(`Disallowed character in controlled equation parser: "${ch}"`);
  }
  return tokens;
}

class RecursiveDescentEvaluator {
  private pos = 0;
  private readonly tokens: Token[];
  private readonly scope: Record<string, number>;
  constructor(tokens: Token[], scope: Record<string, number>) {
    this.tokens = tokens;
    this.scope = scope;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const tok = this.tokens[this.pos];
    if (!tok) throw new Error('Unexpected end of expression');
    this.pos++;
    return tok;
  }

  parseExpression(): number {
    const val = this.parseAddSub();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at position ${this.pos}`);
    }
    return val;
  }

  private parseAddSub(): number {
    let left = this.parseMulDiv();
    while (true) {
      const tok = this.peek();
      if (tok?.type === 'op' && (tok.value === '+' || tok.value === '-')) {
        this.consume();
        const right = this.parseMulDiv();
        left = tok.value === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  private parseMulDiv(): number {
    let left = this.parsePower();
    while (true) {
      const tok = this.peek();
      if (tok?.type === 'op' && (tok.value === '*' || tok.value === '/')) {
        this.consume();
        const right = this.parsePower();
        if (tok.value === '/') {
          if (Math.abs(right) < 1e-18) throw new Error('Division by zero in equation');
          left = left / right;
        } else {
          left = left * right;
        }
      } else {
        break;
      }
    }
    return left;
  }

  private parsePower(): number {
    const base = this.parseUnary();
    const tok = this.peek();
    if (tok?.type === 'op' && tok.value === '^') {
      this.consume();
      const exp = this.parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  private parseUnary(): number {
    const tok = this.peek();
    if (tok?.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      this.consume();
      const val = this.parseUnary();
      return tok.value === '-' ? -val : val;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const tok = this.consume();
    if (tok.type === 'number') return tok.value;
    if (tok.type === 'paren' && tok.value === '(') {
      const val = this.parseAddSub();
      const close = this.consume();
      if (close.type !== 'paren' || close.value !== ')') {
        throw new Error('Mismatched parenthesis in expression');
      }
      return val;
    }
    if (tok.type === 'ident') {
      const next = this.peek();
      if (next?.type === 'paren' && next.value === '(') {
        const fn = SAFE_FUNCTIONS[tok.value];
        if (!fn) throw new Error(`Disallowed function "${tok.value}"`);
        this.consume(); // '('
        const args: number[] = [];
        if (this.peek()?.type !== 'paren' || (this.peek() as { type: 'paren'; value: string }).value !== ')') {
          args.push(this.parseAddSub());
          while (this.peek()?.type === 'comma') {
            this.consume();
            args.push(this.parseAddSub());
          }
        }
        const close = this.consume();
        if (close.type !== 'paren' || close.value !== ')') {
          throw new Error(`Expected ')' after arguments to ${tok.value}`);
        }
        return fn(...args);
      }
      if (Object.prototype.hasOwnProperty.call(this.scope, tok.value)) {
        const v = this.scope[tok.value];
        if (!Number.isFinite(v)) throw new Error(`Non-finite variable "${tok.value}"`);
        return v;
      }
      if (Object.prototype.hasOwnProperty.call(SAFE_CONSTANTS, tok.value)) {
        return SAFE_CONSTANTS[tok.value];
      }
      throw new Error(`Unknown variable "${tok.value}"`);
    }
    throw new Error('Invalid syntax in equation');
  }
}

export function evaluateControlledEquation(
  expression: string,
  variables: Record<string, number>
): number {
  const tokens = tokenize(expression);
  if (tokens.length === 0) throw new Error('Empty equation expression');
  const evaluator = new RecursiveDescentEvaluator(tokens, variables);
  const res = evaluator.parseExpression();
  if (!Number.isFinite(res)) {
    throw new Error(`Equation "${expression}" produced non-finite value`);
  }
  return res;
}

class DimensionalEvaluator {
  private pos = 0;
  private readonly tokens: Token[];
  private readonly dims: Record<string, SiDimension>;
  constructor(tokens: Token[], dims: Record<string, SiDimension>) {
    this.tokens = tokens;
    this.dims = dims;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const tok = this.tokens[this.pos];
    if (!tok) throw new Error('Unexpected end of expression');
    this.pos++;
    return tok;
  }

  parseDimension(): SiDimension {
    const d = this.parseAddSub();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at position ${this.pos}`);
    }
    return d;
  }

  private parseAddSub(): SiDimension {
    const left = this.parseMulDiv();
    while (true) {
      const tok = this.peek();
      if (tok?.type === 'op' && (tok.value === '+' || tok.value === '-')) {
        this.consume();
        const right = this.parseMulDiv();
        if (!dimensionsEqual(left, right)) {
          throw new Error(
            `Dimensional mismatch in addition/subtraction: [${formatDimension(left)}] vs [${formatDimension(right)}]`
          );
        }
      } else {
        break;
      }
    }
    return left;
  }

  private parseMulDiv(): SiDimension {
    let left = this.parsePower();
    while (true) {
      const tok = this.peek();
      if (tok?.type === 'op' && (tok.value === '*' || tok.value === '/')) {
        this.consume();
        const right = this.parsePower();
        const sign = tok.value === '*' ? 1 : -1;
        left = [
          left[0] + sign * right[0],
          left[1] + sign * right[1],
          left[2] + sign * right[2],
          left[3] + sign * right[3],
          left[4] + sign * right[4],
        ] as const;
      } else {
        break;
      }
    }
    return left;
  }

  private parsePower(): SiDimension {
    const base = this.parseUnary();
    const tok = this.peek();
    if (tok?.type === 'op' && tok.value === '^') {
      this.consume();
      const expTok = this.peek();
      if (expTok?.type !== 'number') {
        throw new Error('Exponent in dimensional check must be a dimensionless numeric literal');
      }
      this.consume();
      const k = expTok.value;
      return [base[0] * k, base[1] * k, base[2] * k, base[3] * k, base[4] * k] as const;
    }
    return base;
  }

  private parseUnary(): SiDimension {
    const tok = this.peek();
    if (tok?.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): SiDimension {
    const tok = this.consume();
    if (tok.type === 'number') return DIM_DIMENSIONLESS;
    if (tok.type === 'paren' && tok.value === '(') {
      const d = this.parseAddSub();
      const close = this.consume();
      if (close.type !== 'paren' || close.value !== ')') throw new Error('Mismatched parenthesis');
      return d;
    }
    if (tok.type === 'ident') {
      const next = this.peek();
      if (next?.type === 'paren' && next.value === '(') {
        this.consume();
        const argDims: SiDimension[] = [];
        argDims.push(this.parseAddSub());
        while (this.peek()?.type === 'comma') {
          this.consume();
          argDims.push(this.parseAddSub());
        }
        const close = this.consume();
        if (close.type !== 'paren' || close.value !== ')') throw new Error('Expected )');
        if (tok.value === 'sqrt') {
          const a = argDims[0];
          return [a[0] * 0.5, a[1] * 0.5, a[2] * 0.5, a[3] * 0.5, a[4] * 0.5] as const;
        }
        if (tok.value === 'abs' || tok.value === 'min' || tok.value === 'max') {
          return argDims[0];
        }
        return DIM_DIMENSIONLESS;
      }
      if (Object.prototype.hasOwnProperty.call(this.dims, tok.value)) {
        return this.dims[tok.value];
      }
      if (Object.prototype.hasOwnProperty.call(SAFE_CONSTANTS, tok.value)) {
        return DIM_DIMENSIONLESS;
      }
      throw new Error(`Unknown variable "${tok.value}" in dimensional analysis`);
    }
    throw new Error('Invalid syntax in dimensional analysis');
  }
}

export function verifyEquationDimensions(
  expression: string,
  variableDims: Record<string, SiDimension>,
  expectedDimension: SiDimension
): { passed: boolean; computedDimension: SiDimension; error?: string } {
  try {
    const tokens = tokenize(expression);
    const analyzer = new DimensionalEvaluator(tokens, variableDims);
    const computed = analyzer.parseDimension();
    const passed = dimensionsEqual(computed, expectedDimension);
    return {
      passed,
      computedDimension: computed,
      ...(passed
        ? {}
        : {
            error: `Expected [${formatDimension(expectedDimension)}] but got [${formatDimension(computed)}]`,
          }),
    };
  } catch (err) {
    return {
      passed: false,
      computedDimension: DIM_DIMENSIONLESS,
      error: err instanceof Error ? err.message : 'Dimensional analysis error',
    };
  }
}
