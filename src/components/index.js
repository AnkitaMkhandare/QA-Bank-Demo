/**
 * Components - Barrel Export
 * Import all reusable UI components from a single entry point.
 * 
 * Usage:
 *   const { NavigationBar, Modal, DataTable } = require('../src/components');
 */

const NavigationBar = require('./NavigationBar');
const Modal = require('./Modal');
const DataTable = require('./DataTable');

module.exports = {
  NavigationBar,
  Modal,
  DataTable,
};