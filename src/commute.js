// Description
//   A hubot script for the Crescent Commute
//
// Configuration:
//   HUBOT_COMMUTE_MAPS_KEY: your mapquest API key
//   HUBOT_COMMUTE_MAPS_WORK: your work address as a Location
//   HUBOT_COMMUTE_MAPS_HOME: your home address as a Location
//   Locations are formatted as JSON strings:
//     {
//       "street":     "1 Happy Street",
//       "city":       "Springfield",
//       "state":      "NY",
//       "postalCode": "12345"
//     }
//
// Commands:
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   Robert McLaughlin <rmclaughlin@constantcontact.com>

var baseUrl = 'http://www.mapquestapi.com',
    basePath = '/directions/v2/route',
    key = process.env['HUBOT_COMMUTE_MAPS_KEY'],
    work = JSON.parse(process.env['HUBOT_COMMUTE_MAPS_WORK']),
    home = JSON.parse(process.env['HUBOT_COMMUTE_MAPS_HOME']);

module.exports = function (robot) {
  var api = robot.http(baseUrl).path(basePath);

  robot.respond(/maps\sdebug/, function(res) {
    console.log('beginning map debug');
    var data = JSON.stringify({
      locations: [work, home]
    });
    console.log(data);
    api.header('Accept', 'application/json')
       .query({key: key})
       .post(data)(function(err, response, body) {
         if (err) {
           console.error(err.stack);
           return res.reply('Oops!');
         }
         res.reply(body);
       });
  });
}
