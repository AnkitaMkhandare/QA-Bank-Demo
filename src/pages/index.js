/**
 * Page Objects - Barrel Export
 * Import all page objects from a single entry point.
 * 
 * Usage:
 *   const { LoginPage, DashboardPage, AccountsPage, TransactionsPage } = require('../src/pages');
 */

const BasePage = require('./BasePage');
const LoginPage = require('./LoginPage');
const DashboardPage = require('./DashboardPage');
const AccountsPage = require('./AccountsPage');
const TransactionsPage = require('./TransactionsPage');

module.exports = {
  BasePage,
  LoginPage,
  DashboardPage,
  AccountsPage,
  TransactionsPage,
};