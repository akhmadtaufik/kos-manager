export default defineEventHandler((event) => {
  // Deliberately throwing an unhandled error to test the Centralized Error Handler's 500 masking
  // and Pino structured logging capabilities.
  throw new Error("SECRET_DATABASE_CRASH");
});
