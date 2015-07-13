// Description
//   A hubot script for the Crescent Refugee Camp to enjoy :D
//   It will report information from the LastFM API
//
// Intended Features:
//    - get last song played/playing of specific user
//    - map hipchat username to lastFM username
//
// Configuration:
//   HUBOT_LASTFM_API_KEY The key to access lastFM's API
//
// Commands:
//   whatisplaying?
//   whatis <user> playing?
//
// Notes:
//   lol Notes pls
//
// Original By:
//   guilleiguaran
//   sn0opy
//
// Re-write Author:
//   DatGuyOverThere <noreply@ultipro.com>

getSong = (msg, user) ->
  msg.http('http://ws.audioscrobbler.com/2.0/?')
    .query(method: 'user.getrecenttracks', user: user, api_key: process.env.HUBOT_LASTFM_API_KEY, format: 'json')
    .get() (err, res, body) ->
      results = JSON.parse(body)
      if results.error
        msg.send results.message
        return
      song = results.recenttracks.track[0]
      msg.send song.name + ' by ' + song.artist['#text']

getMap = (user) ->
  return user

setMap = (msg, lastfmUser) ->
  user = msg.message.user.name
  maaaaaaps = robot.brain.get('maaaaaaps') || []
  maaaaaaps[user] = lastfmUser
  robot.brain.set maaaaaaps, maaaaaaps

module.exports = function (robot) {
  robot.respond /what'?s (.*) playing/i, (msg) ->
    getSong(msg, msg.match[2])
  robot.respond /what(')?s playing/i, (msg) ->
    getSong(msg, getMap(msg.message.user.name))
  robot.respond /my lastfm is (.*)/i, (msg) ->
    setMap(msg, msg.match[1])
}
