export class TileDBError extends Error {
  public component?: string;
  public details?: string;

  constructor(message: string) {
    super(message);
    this.name = 'TileDBError';
    Object.setPrototypeOf(this, new.target.prototype);

    const match = message.match(/\[TileDB::(.*?)\]\s+Error:\s+(.*)/i);
    if (match) {
      this.component = match[1].trim();
      this.details = match[2].trim();
    }
  }
}
