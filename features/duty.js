'use strict';

/**
 * @type {Object}
 */
module.exports = {
    dutyFinder: () => {
        return {
            /**
             * Loading the libraries in an init method will
             * allow instanciating the libraries only when GiveMeFoodNow() is used/needed.
             * @return {[type]} [description]
             */
            _init: function (res) {
                // Libraries
                this._request = require('sync-request');
                this._fs = require('fs');
                this._config = require('../config.js');

                // Extend base classes
                Array.prototype.contains = function (needle) {
                    return (this.indexOf(needle) > -1);
                };
                Array.prototype.findAndRemove = function (needle) {
                    var index = this.indexOf(needle);
                    if (index > -1) {
                        this.splice(index, 1);
                    }
                };
                Array.prototype.diff = function (array) {
                    return this.filter(function (i) {
                        return array.indexOf(i) < 0;
                    });
                };
                Array.prototype.cyclicallyGetElements = function (index, int) {
                    var elements_to_return = [];
                    for (var i = 0; i < int; i++) {
                        // Check if we reached end of array. if so, reset int to 0
                        if (this.length === index) {
                            index = 0;
                        }
                        elements_to_return.push(this[index]);
                        index++;
                    }
                    return elements_to_return;
                };
                Array.prototype.cyclicallyMoveIndex = function (index, int) {
                    for (var i = 0; i < int; i++) {
                        // Check if we reached end of array. if so, reset index to 0
                        if (this.length === index) {
                            index = 0;
                        }
                        index++;
                    }
                    return index;
                };
                Date.prototype.getWeek = function () {
                    var onejan = new Date(this.getFullYear(), 0, 1);
                    var millisecsInDay = 86400000;
                    return Math.ceil((((this - onejan) / millisecsInDay) + onejan.getDay() + 1) / 7);
                };

                // Arguments
                this._res = res;

                this._calculateMembersOnDuty();
            },

            /**
             * Calculate the members on duty
             * @return {[type]} [description]
             */
            _calculateMembersOnDuty: function () {
                // Get slack members
                var response     = this._request('GET', 'https://slack.com/api/users.list?token=' + this._config.nikos_slack_token);
                var slackMembers = JSON.parse(response.body.toString('utf-8')).members;

                // Exclude not applicable
                var notApplicable      = ['Anil Gupta', 'Sebastien Requiem', 'Thor Christensen', 'slackbot'];
                var activeSlackMembers = [];
                slackMembers.forEach(function (m) {
                    if (m.deleted || m.is_bot || notApplicable.contains(m.real_name)) {
                        return;
                    }
                    activeSlackMembers.push(m.real_name)
                });

                // Get file members
                var dataInFile = this._fs.readFileSync(__dirname + '/../food_helpers.txt').toString();
                dataInFile     = JSON.parse(dataInFile);

                // Add users that were added to slack
                var write = false;
                var addedSinceLastCall = activeSlackMembers.diff(dataInFile.active_members);
                addedSinceLastCall.forEach(function (m) {
                    dataInFile.active_members.push(m);
                    write = true;
                });

                // Remove users that were removed from slack
                var removedSinceLastCall = dataInFile.active_members.diff(activeSlackMembers);
                removedSinceLastCall.forEach(function (m) {
                    dataInFile.active_members.findAndRemove(m);
                    write = true;
                });

                // Get current week number
                var now  = new Date();
                var week = now.getWeek();

                if (week !== dataInFile.week_number) {
                    dataInFile.week_number = week;
                    dataInFile.index_start = dataInFile.active_members.cyclicallyMoveIndex(dataInFile.index_start, dataInFile.batch);
                    console.log(dataInFile.index_start);
                    write = true;
                }

                if (write) {
                    this._fs.writeFileSync(__dirname + '/../food_helpers.txt', JSON.stringify(dataInFile, null, 3));
                }

                // Get members on duty
                var onDuty = dataInFile.active_members.cyclicallyGetElements(dataInFile.index_start, dataInFile.batch);

                // Send response
                this._sendResponseToSlack(this._res, onDuty);
            },

            /**
             * The response return from the call
             * @return {[type]} [description]
             */
            _sendResponseToSlack: function (res, textToSlack) {
                res.status(200).json({
                    "response_type": "in_channel",
                    "text": textToSlack
                });
            }
        }
    }
}
