import {
  AdminUserSeeder,
  DefaultCharitiesSeeder,
  SampleDataSeeder,
} from "./seeders/index.js";

export const seedRegistry = [
  new AdminUserSeeder(),
  new DefaultCharitiesSeeder(),
  new SampleDataSeeder(),
];
