export class BaseSeeder {
  constructor(name) {
    this.name = name;
  }

  // eslint-disable-next-line class-methods-use-this
  async run() {
    throw new Error("Seeder must implement run(context).");
  }
}
