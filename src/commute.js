// Description
//   A hubot script for calculating the time it would take to commute now
//
// Configuration:
//   HUBOT_COMMUTE_MAPS_KEY: your mapquest API key
//   HUBOT_COMMUTE_MAPS_WORK: your work address as a Location
//   HUBOT_COMMUTE_MAPS_HOME: your home address as a Location
//   HUBOT_COMMUTE_ROOM: the room to announce evening commute times in
//   Locations are formatted as JSON strings:
//     {
//       "street":     "1 Happy Street",
//       "city":       "Springfield",
//       "state":      "NY",
//       "postalCode": "12345"
//     }
//
// Commands:
//   CrescentBot commute to (work|home)- Tells info about the afternoon commute
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   Robert McLaughlin <rmclaughlin@constantcontact.com>
var CronJob = require('cron').CronJob;

var announceRoom = process.env['HUBOT_COMMUTE_ROOM'],
    baseUrl = 'http://www.mapquestapi.com',
    basePath = '/directions/v2/route',
    key = process.env['HUBOT_COMMUTE_MAPS_KEY'],
    work = JSON.parse(process.env['HUBOT_COMMUTE_MAPS_WORK']),
    home = JSON.parse(process.env['HUBOT_COMMUTE_MAPS_HOME']);

module.exports = function (robot) {
  var api = robot.http(baseUrl).path(basePath);

  var doCommute = function(room, toWork) {
    console.log(room);
    console.log(arguments);
    var data = JSON.stringify({
      locations: toWork ? [home, work] : [work, home],
      useTraffic: true,
      timeType: 1
    });
    api.header('Accept', 'application/json')
       .query({key: key})
       .post(data)(function(err, response, body) {
         if (err) {
           console.error(err.stack);
           return robot.messageRoom(room, 'Oops! I messed up.');
         }
         var route = JSON.parse(body).route;
         var mins = Math.round(route.realTime/60);
         var isHighway = route.legs.reduce(function(prev, curr) {
           return prev || curr.maneuvers.reduce(function(prev, curr) {
             return prev || curr.streets.indexOf('I-95 S') >= 0
                         || curr.streets.indexOf('I-95 N') >= 0;
           }, false);
         }, false);
         robot.messageRoom(
           room,
           (isHighway ? '' : 'don\'t ') +
             'take the highway: the commute ' +
             (toWork ? 'to' : 'from') +
             ' work will take ' + mins + ' minutes'
         );
       });
  }

  // announce commute time at 4:55pm every week day
  new CronJob('00 55 16 * * 1-5', function() {
    doCommute(announceRoom, false);
  }, null, true, 'America/New_York');

  // announce commute time at 8:40am every week day
  new CronJob('00 40 08 * * 1-5', function() {
    doCommute(announceRoom, true);
  }, null, true, 'America/New_York');

  robot.respond(/commute to (work|home)/i, function(res) {
    doCommute(res.message.user.reply_to, res.match[1] == 'work');
  });

}
