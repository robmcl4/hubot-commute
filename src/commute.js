// Description
//   A hubot script for the Crescent Commute
//
// Configuration:
//   HUBOT_COMMUTE_MAPS_KEY: your google maps API key
//   HUBOT_COMMUTE_MAPS_WORK: your work address
//   HUBOT_COMMUTE_MAPS_HOME: your home address
//
// Commands:
//   hubot hello - <what the respond trigger does>
//   orly - <what the hear trigger does>
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   Robert McLaughlin <rmclaughlin@constantcontact.com>
var GoogleMapsAPI = require('googlemaps');

var gm = new GoogleMapsAPI({
  key: process.env['HUBOT_COMMUTE_MAPS_KEY'],
  stagger_time: 1000,
  encode_polylines: false,
  secure: true
});

var query = {
  origin: process.env['HUBOT_COMMUTE_MAPS_WORK'],
  destination: process.env['HUBOT_COMMUTE_MAPS_HOME']
};

module.exports = function (robot) {
  robot.respond(/maps\sdebug/, function(res) {
    console.log('beginning map debug');
    gm.directions(query, function(err, result) {
      if (err) {
        res.reply('Oops! I can\'t do that!');
        console.error(err.stack);
      } else {
        res.reply(result['routes'][0]['summary'].indexOf('I-95') >= 0 ? "Take 95." : "Don't take 95.");
      }
    });
  });
}
