export class IdGenerator {
  private prefix: string;
  private id: number;

  constructor(prefix: string = "") {
    this.prefix = prefix;
    this.id = 0;
  }

  public next() {
    this.id += 1;
    return `${this.prefix}_${this.id}`;
  }
}
