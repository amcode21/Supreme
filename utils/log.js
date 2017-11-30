const chalk = require('chalk');
const moment = require('moment');

let info = (message, instance = 'Global') => {
    console.log(chalk.blue(`[${moment().format('hh:mm:ss')}] [${instance}] ${message}`));
}

let error = (message, instance = 'Global') => {
    console.log(chalk.red(`[${moment().format('hh:mm:ss')}] [${instance}] ${message}`));
}

let success = (message, instance = 'Global') => {
    console.log(chalk.green(`[${moment().format('hh:mm:ss')}] [${instance}] ${message}`));
}

let warning = (message, instance = 'Global') => {
    console.log(chalk.yellow(`[${moment().format('hh:mm:ss')}] [${instance}] ${message}`));
}

module.exports = {
    info,
    error,
    success,
    warning
}
