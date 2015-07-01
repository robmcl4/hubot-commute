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
    basePath = '/directions/v2/alternateroutes',
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
      timeType: 1,
      maxRoutes: 4
    });
    api.header('Accept', 'application/json')
       .query({key: key})
       .post(data)(function(err, response, body) {
         if (err) {
           console.error(err.stack);
           return robot.messageRoom(room, 'Oops! I messed up.');
         }

         // construct the list of routes
         var routes = (function() {
           var route = JSON.parse(body).route;
           var ret = route.alternateRoutes.map(function(r) {return r.route});
           delete route.alternateRoutes;
           ret.push(route);
           // sort by total
           return ret.sort(function(a, b) {b.realTime - a.realTime});
         })();

         // construct the summaries
         var summaries = (function() {
           var summaries = [];
           // we get two exit 26s typically... only grab the first
           var gotA26 = false;
           for (var i=0; i<routes.length; i++) {
             var route = routes[i];
             var summary;
             if (toWork) {
               console.log(route)
               if (route.name.match(/I-95 N/)) {
                 summary = "The highway";
               } else if (route.name.match(/Totten Pond/)) {
                 summary = "The highway (alt. entrance)"
               } else {
                 summary = "Unrecognized route: '" + route.name + "''";
               }
             } else {
               if (route.name.match(/Totten Pond/)) {
                 summary = "Exit 27 to Totten Pond Rd";
               } else if (route.name.match(/(US-20 E|Vernon St)/)) {
                 if (gotA26)
                   continue;
                 gotA26 = true;
                 summary = "Exit 26 to Waltham";
               } else {
                 summary = "Unrecognized route: '" + route.name + "''";
               }
             }
             var mins = Math.round(route.realTime/60);
             summaries.push(summary + ' will take ' + mins + ' minutes');
           }
           return summaries;
         })();

         var msg = summaries.join('\n');

         robot.messageRoom(room, msg);
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
