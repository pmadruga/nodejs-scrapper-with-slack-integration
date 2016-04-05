'use strict';

/**
 * In case you are wondering why I prefer object composing over inheritance in this case,
 * here is the explanation better than anything I might have come up with:
 * http://stackoverflow.com/questions/49002/prefer-composition-over-inheritance
 * @type {Object}
 */
module.exports = {
  giveMeFood: () => {
    return {
      /**
       * Loading the libraries in an init method will
       * allow instanciating the libraries only when GiveMeFoodNow() is used/needed.
       * @return {[type]} [description]
       */
      _init: function(res, username) {
        // Libraries
        const Xray = require('x-ray');
        this._moment = require('moment');
        this._xray = Xray();

        // Arguments
        this._res = res;
        this._username = username;

        this._scrapeTheFoodProviderWebsite();

        return this;
      },

      /**
       * Scraping the website of the lunch provider
       * @return {[type]} [description]
       */
      _scrapeTheFoodProviderWebsite: function() {

        // Today's date is needed for the DOM selector
        let today = this._moment().format('dddd');

        if (today === 'Wednesday'){
          today = 'Whensday'
        }

        // The DOM selector
        const selector = '#Leftcontent_PlaceHolder_C019_PageView' + today;

        // The actual scraping
        this._xray('http://maaltidet.dk/maaltiderne/tradition/menukort', selector, {
          menu: ['.ny_rt']
        })((error, data) => {

          const res = this._res;
          const textToSlack = "Kære søde " + this._username + "!\n\nDagens *varme ret* er " + data.menu[0].toLowerCase() + ".\n*Pålægssalaten* er " + data.menu[1].toLowerCase() + ".\n*Pålægget* er " + data.menu[2].toLowerCase() + ". \n*Salaten* er " + data.menu[3].toLowerCase() + ".\n\n Velbekomme!";

          console.log(textToSlack);

          this._sendResponseToSlack(res, textToSlack)
        });
      },

      /**
       * The response return from the / GET call
       * @return {[type]} [description]
       */
      _sendResponseToSlack: function(res, textToSlack) {
        res.status(200).json({
          "response_type": "in_channel",
          "text": textToSlack
        });
      },
    }
  }
}
