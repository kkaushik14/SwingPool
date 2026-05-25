import { CharityModel } from "../../../components/charities/charities.model.js";

import { BaseSeeder } from "../base-seeder.js";

const DEFAULT_CHARITIES = [
  {
    code: "first-tee-india",
    name: "First Tee India",
    mission:
      "Empowering young golfers through access, mentorship, and training resources.",
    website: "https://example.org/first-tee-india",
    isFeatured: true,
    totalRaised: 0,
    totalRaisedMajor: "0.00",
    currency: "INR",
    supportedCurrencies: ["INR"],
  },
  {
    code: "women-in-golf-foundation",
    name: "Women in Golf Foundation",
    mission:
      "Increasing participation and opportunity for women in amateur and competitive golf.",
    website: "https://example.org/women-golf",
    isFeatured: true,
    totalRaised: 0,
    totalRaisedMajor: "0.00",
    currency: "INR",
    supportedCurrencies: ["INR"],
  },
];

export class DefaultCharitiesSeeder extends BaseSeeder {
  constructor() {
    super("default-charities-seeder");
  }

  async run({ logger }) {
    for (const charity of DEFAULT_CHARITIES) {
      const existing = await CharityModel.findOne({ name: charity.name });

      if (existing) {
        logger.info({ charity: charity.name }, "Charity seed already exists.");
        continue;
      }

      await CharityModel.create(charity);
      logger.info({ charity: charity.name }, "Charity seed created.");
    }
  }
}
