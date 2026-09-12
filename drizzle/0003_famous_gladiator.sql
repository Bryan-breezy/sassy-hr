-- Safe schema cleanup: routePlans was verified to contain zero rows before this change.
-- All new daily route details are persisted in the related routePlanDays table.
ALTER TABLE `routePlans` DROP COLUMN `dailyRoutes`;