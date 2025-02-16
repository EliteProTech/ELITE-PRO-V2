const chalk = require('chalk')
const fs = require('fs')

global.tutorials = (prefix, hituet) => {
return`
*╭────❍* Tutorials *❍*
*┊❍* ${prefix}deploy
*┊❍* ${prefix}panel
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.animemenu = (prefix) => {
return `
*╭────❍* Anime *❍*
*┊❍* ${prefix}akira
*┊❍* ${prefix}akiyama
*┊❍* ${prefix}ana
*┊❍* ${prefix}asuna
*┊❍* ${prefix}ayuzawa
*┊❍* ${prefix}boruto
*┊❍* ${prefix}chiho
*┊❍* ${prefix}chitoge
*┊❍* ${prefix}cosplayloli
*┊❍* ${prefix}cosplaysagiri
*┊❍* ${prefix}deidara
*┊❍* ${prefix}doraemon
*┊❍* ${prefix}elaina
*┊❍* ${prefix}emilia
*┊❍* ${prefix}erza
*┊❍* ${prefix}gremory
*┊❍* ${prefix}hestia
*┊❍* ${prefix}husbu
*┊❍* ${prefix}inori
*┊❍* ${prefix}isuzu
*┊❍* ${prefix}itachi
*┊❍* ${prefix}itori
*┊❍* ${prefix}kaga
*┊❍* ${prefix}kagura
*┊❍* ${prefix}kakasih
*┊❍* ${prefix}kaori
*┊❍* ${prefix}keneki
*┊❍* ${prefix}kotori
*┊❍* ${prefix}kurumi
*┊❍* ${prefix}loli
*┊❍* ${prefix}loli2
*┊❍* ${prefix}madara
*┊❍* ${prefix}megumin
*┊❍* ${prefix}mikasa
*┊❍* ${prefix}mikey
*┊❍* ${prefix}miku
*┊❍* ${prefix}minato
*┊❍* ${prefix}naruto
*┊❍* ${prefix}neko
*┊❍* ${prefix}nekonime
*┊❍* ${prefix}nezuko
*┊❍* ${prefix}onepiece
*┊❍* ${prefix}pokemon
*┊❍* ${prefix}randomnime
*┊❍* ${prefix}randomnime2
*┊❍* ${prefix}rize
*┊❍* ${prefix}sagiri
*┊❍* ${prefix}sakura
*┊❍* ${prefix}sasuke
*┊❍* ${prefix}shina
*┊❍* ${prefix}shinka
*┊❍* ${prefix}shinomiya
*┊❍* ${prefix}shizuka
*┊❍* ${prefix}shota
*┊❍* ${prefix}tejina
*┊❍* ${prefix}toukachan
*┊❍* ${prefix}tsunade
*┊❍* ${prefix}waifu
*┊❍* ${prefix}waifu2
*┊❍* ${prefix}animewall
*┊❍* ${prefix}yotsuba
*┊❍* ${prefix}yuki
*┊❍* ${prefix}yulibocil
*┊❍* ${prefix}yumeko
*┊❍* ${prefix}8ball
*┊❍* ${prefix}tickle
*┊❍* ${prefix}gecg
*┊❍* ${prefix}feed
*┊❍* ${prefix}animeawoo
*┊❍* ${prefix}animemegumin
*┊❍* ${prefix}animeshinobu
*┊❍* ${prefix}animehandhold
*┊❍* ${prefix}animehighfive
*┊❍* ${prefix}animecringe
*┊❍* ${prefix}animedance
*┊❍* ${prefix}animehappy
*┊❍* ${prefix}animeglomp
*┊❍* ${prefix}animeblush
*┊❍* ${prefix}animesmug
*┊❍* ${prefix}animewave ??
*┊❍* ${prefix}animesmille
*┊❍* ${prefix}animepoke
*┊❍* ${prefix}animewink
*┊❍* ${prefix}animebonk
*┊❍* ${prefix}animebully
*┊❍* ${prefix}animeyeet
*┊❍* ${prefix}animebite
*┊❍* ${prefix}animelick
*┊❍* ${prefix}animekill
*┊❍* ${prefix}animecry
*┊❍* ${prefix}animewlp
*┊❍* ${prefix}animekiss
*┊❍* ${prefix}animehug
*┊❍* ${prefix}animeneko
*┊❍* ${prefix}animepat
*┊❍* ${prefix}animeslap
*┊❍* ${prefix}animecuddle
*┊❍* ${prefix}animewaifu
*┊❍* ${prefix}animenom
*┊❍* ${prefix}animefoxgirl
*┊❍* ${prefix}animegecg
*┊❍* ${prefix}animetickle
*┊❍* ${prefix}animefeed
*┊❍* ${prefix}animeavatar
*┊❍* ${prefix}anime
*┊❍* ${prefix}animequote
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.ownermenu = (prefix) => {
return `
*╭────❍* Owner Menu *❍*
*┊❍* ${prefix}autoread
*┊❍* ${prefix}autobio
*┊❍* ${prefix}autotype
*┊❍* ${prefix}unavailable
*┊❍* ${prefix}autorecord
*┊❍* ${prefix}autorecordtype
*┊❍* ${prefix}autoswview
*┊❍* ${prefix}setautoblock
*┊❍* ${prefix}setantiforeign
*┊❍* ${prefix}autoblock
*┊❍* ${prefix}onlygc
*┊❍* ${prefix}onlypc
*┊❍* ${prefix}onlyindia
*┊❍* ${prefix}onlyindo
*┊❍* ${prefix}anticall
*┊❍* ${prefix}private
*┊❍* ${prefix}public
*┊❍* ${prefix}join
*┊❍* ${prefix}poll
*┊❍* ${prefix}bc
*┊❍* ${prefix}bcgroup
*┊❍* ${prefix}setmenu
*┊❍* ${prefix}setimgmenu
*┊❍* ${prefix}setvidmenu
*┊❍* ${prefix}setgifmenu
*┊❍* ${prefix}setreply
*┊❍* ${prefix}setprefix
*┊❍* ${prefix}addlimit
*┊❍* ${prefix}dellimit
*┊❍* ${prefix}resethit
*┊❍* ${prefix}resetuser
*┊❍* ${prefix}creategc
*┊❍* ${prefix}userjid
*┊❍* ${prefix}setexif
*┊❍* ${prefix}setbotbio
*┊❍* ${prefix}delppbot
*┊❍* ${prefix}restart
*┊❍* ${prefix}setppbot
*┊❍* ${prefix}addprem
*┊❍* ${prefix}delprem
*┊❍* ${prefix}addowner
*┊❍* ${prefix}delowner
*┊❍* ${prefix}addvn
*┊❍* ${prefix}addapk
*┊❍* ${prefix}addzip
*┊❍* ${prefix}addpdf
*┊❍* ${prefix}delapk
*┊❍* ${prefix}delzip
*┊❍* ${prefix}delpdf
*┊❍* ${prefix}delvn
*┊❍* ${prefix}addsticker
*┊❍* ${prefix}delsticker
*┊❍* ${prefix}addimage
*┊❍* ${prefix}delimage
*┊❍* ${prefix}addvideo
*┊❍* ${prefix}delvideo
*┊❍* ${prefix}addtitle
*┊❍* ${prefix}deltitle
*┊❍* ${prefix}upswtext
*┊❍* ${prefix}upswvideo
*┊❍* ${prefix}upswimage
*┊❍* ${prefix}upswaudio
*┊❍* ${prefix}block
*┊❍* ${prefix}unblock
*┊❍* ${prefix}leavegc
*┊❍* ${prefix}pushcontact
*┊❍* ${prefix}pushcontactv2
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.othermenu = (prefix) => {
return `
*╭────❍* Other Menu *❍*
*┊❍* ${prefix}ping
*┊❍* ${prefix}menu
*┊❍* ${prefix}myip
*┊❍* ${prefix}repo
*┊❍* ${prefix}reportbug
*┊❍* ${prefix}listprem
*┊❍* ${prefix}listowner
*┊❍* ${prefix}liststicker
*┊❍* ${prefix}listimage
*┊❍* ${prefix}listvideo
*┊❍* ${prefix}listvn
*┊❍* ${prefix}listapk
*┊❍* ${prefix}listzip
*┊❍* ${prefix}listpdf
*┊❍* ${prefix}listbadword
*┊❍* ${prefix}listpc
*┊❍* ${prefix}listgc
*┊❍* ${prefix}isgroup
*┊❍* ${prefix}owner
*┊❍* ${prefix}rentbot
*┊❍* ${prefix}donate
*┊❍* ${prefix}friend
*┊❍* ${prefix}obfuscate
*┊❍* ${prefix}styletext
*┊❍* ${prefix}fliptext
*┊❍* ${prefix}tts
*┊❍* ${prefix}say
*┊❍* ${prefix}togif
*┊❍* ${prefix}toqr
*┊❍* ${prefix}bass
*┊❍* ${prefix}blown
*┊❍* ${prefix}deep
*┊❍* ${prefix}earrape
*┊❍* ${prefix}fast
*┊❍* ${prefix}fat
*┊❍* ${prefix}nightcore
*┊❍* ${prefix}reverse
*┊❍* ${prefix}robot
*┊❍* ${prefix}slow
*┊❍* ${prefix}smooth
*┊❍* ${prefix}squirrel
*┊❍* ${prefix}tinyurl
*┊❍* ${prefix}tovn
*┊❍* ${prefix}toaudio
*┊❍* ${prefix}tomp3
*┊❍* ${prefix}tomp4
*┊❍* ${prefix}toimg
*┊❍* ${prefix}toonce
*┊❍* ${prefix}sticker
*┊❍* ${prefix}take 
*┊❍* ${prefix}emoji
*┊❍* ${prefix}volaudio
*┊❍* ${prefix}volvideo
*┊❍* ${prefix}ebinary
*┊❍* ${prefix}dbinary
*┊❍* ${prefix}ssweb
*┊❍* ${prefix}quoted
*┊❍* ${prefix}checkaccount
*┊❍* ${prefix}runtime
*┊❍* ${prefix}translate
*┊❍* ${prefix}quran
*┊❍* ${prefix}bible
*┊❍* ${prefix}alive
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.downloadmenu = (prefix) => {
return `
*╭────❍* Download Menu *❍*
*┊❍* ${prefix}ytsearch
*┊❍* ${prefix}itunes
*┊❍* ${prefix}aio
*┊❍* ${prefix}instagram
*┊❍* ${prefix}play
*┊❍* ${prefix}video
*┊❍* ${prefix}ytmp3
*┊❍* ${prefix}ytmp4
*┊❍* ${prefix}tiktokaudio
*┊❍* ${prefix}tiktok
*┊❍* ${prefix}apk
*┊❍* ${prefix}igvideo
*┊❍* ${prefix}igimage
*┊❍* ${prefix}facebook
*┊❍* ${prefix}mediafire
*┊❍* ${prefix}apk
*┊❍* ${prefix}google
*┊❍* ${prefix}imdb
*┊❍* ${prefix}weather
*┊❍* ${prefix}wanumber
*┊❍* ${prefix}spotify 
*┊❍* ${prefix}gitclone
*┊❍* ${prefix}happymod
*┊❍* ${prefix}gdrive
*┊❍* ${prefix}pinterest
*┊❍* ${prefix}ringtone
*┊❍* ${prefix}song
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.groupmenu = (prefix) => {
return `
*╭────❍* Group Menu *❍*
*┊❍* ${prefix}antibot 
*┊❍* ${prefix}gc
*┊❍* ${prefix}antiviewonce 
*┊❍* ${prefix}welcome 
*┊❍* ${prefix}adminevent 
*┊❍* ${prefix}groupevent 
*┊❍* ${prefix}antiforeign 
*┊❍* ${prefix}antimedia 
*┊❍* ${prefix}antiaudio 
*┊❍* ${prefix}antivideo 
*┊❍* ${prefix}antiimage 
*┊❍* ${prefix}antidocument 
*┊❍* ${prefix}antilocation 
*┊❍* ${prefix}anticontact 
*┊❍* ${prefix}antisticker 
*┊❍* ${prefix}antipoll 
*┊❍* ${prefix}antilink 
*┊❍* ${prefix}antilinkgc 
*┊❍* ${prefix}antivirtex 
*┊❍* ${prefix}grouplink 
*┊❍* ${prefix}listadmin 
*┊❍* ${prefix}invite 
*┊❍* ${prefix}ephemeral 
*┊❍* ${prefix}delete 
*┊❍* ${prefix}setppgroup 
*┊❍* ${prefix}delppgroup 
*┊❍* ${prefix}setnamegc 
*┊❍* ${prefix}setdesc 
*┊❍* ${prefix}add 
*┊❍* ${prefix}kick 
*┊❍* ${prefix}promote 
*┊❍* ${prefix}demote 
*┊❍* ${prefix}getcontact
*┊❍* ${prefix}savecontact
*┊❍* ${prefix}sendcontact
*┊❍* ${prefix}contactag
*┊❍* ${prefix}hidetag 
*┊❍* ${prefix}totag 
*┊❍* ${prefix}tagall 
*┊❍* ${prefix}editinfo 
*┊❍* ${prefix}opentime 
*┊❍* ${prefix}closetime 
*┊❍* ${prefix}resetlink 
*┊❍* ${prefix}getbio 
*┊❍* ${prefix}vote 
*┊❍* ${prefix}upvote 
*┊❍* ${prefix}downvote 
*┊❍* ${prefix}checkvote 
*┊❍* ${prefix}delvote 
*┊❍* ${prefix}autostickergc 
*┊❍* ${prefix}antivirus 
*┊❍* ${prefix}antitoxic 
*┊❍* ${prefix}nsfw 
*┊❍* ${prefix}react 
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.funmenu = (prefix) => {
return `
*╭────❍* Fun Menu *❍*
*┊❍* ${prefix}define
*┊❍* ${prefix}lyrics
*┊❍* ${prefix}tictactoe
*┊❍* ${prefix}suit
*┊❍* ${prefix}math
*┊❍* ${prefix}fact
*┊❍* ${prefix}truth
*┊❍* ${prefix}truth1
*┊❍* ${prefix}dare
*┊❍* ${prefix}couple
*┊❍* ${prefix}soulmate
*┊❍* ${prefix}stupidcheck
*┊❍* ${prefix}handsomecheck
*┊❍* ${prefix}uncleancheck
*┊❍* ${prefix}hotcheck
*┊❍* ${prefix}smartcheck
*┊❍* ${prefix}greatcheck
*┊❍* ${prefix}evilcheck
*┊❍* ${prefix}dogcheck
*┊❍* ${prefix}coolcheck
*┊❍* ${prefix}waifucheck
*┊❍* ${prefix}awesomecheck
*┊❍* ${prefix}gaycheck
*┊❍* ${prefix}cutecheck
*┊❍* ${prefix}lesbiancheck
*┊❍* ${prefix}hornycheck
*┊❍* ${prefix}prettycheck
*┊❍* ${prefix}lovelycheck
*┊❍* ${prefix}uglycheck
*┊❍* ${prefix}pick
*┊❍* ${prefix}pickupline
*┊❍* ${prefix}quotes
*┊❍* ${prefix}can
*┊❍* ${prefix}is
*┊❍* ${prefix}when
*┊❍* ${prefix}where
*┊❍* ${prefix}what
*┊❍* ${prefix}how
*┊❍* ${prefix}rate
*┊❍* ${prefix}cry
*┊❍* ${prefix}kill
*┊❍* ${prefix}hug
*┊❍* ${prefix}pat
*┊❍* ${prefix}lick 
*┊❍* ${prefix}kiss
*┊❍* ${prefix}bite
*┊❍* ${prefix}yeet
*┊❍* ${prefix}bully
*┊❍* ${prefix}bonk
*┊❍* ${prefix}wink
*┊❍* ${prefix}poke
*┊❍* ${prefix}nom
*┊❍* ${prefix}slap
*┊❍* ${prefix}smile 
*┊❍* ${prefix}wave
*┊❍* ${prefix}awoo
*┊❍* ${prefix}blush
*┊❍* ${prefix}smug
*┊❍* ${prefix}glomp 
*┊❍* ${prefix}happy
*┊❍* ${prefix}dance
*┊❍* ${prefix}cringe
*┊❍* ${prefix}cuddle
*┊❍* ${prefix}highfive 
*┊❍* ${prefix}shinobu
*┊❍* ${prefix}handhold
*┊❍* ${prefix}spank
*┊❍* ${prefix}tickle
*┊❍* ${prefix}avatar
*┊❍* ${prefix}feed
*┊❍* ${prefix}fox_girl
*┊❍* ${prefix}gecg
*┊❍* ${prefix}checkme
*┊❍* ${prefix}sound1 - sound161
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.stalkermenu = (prefix) => {
return `
*╭────❍* Stalker *❍*
*┊❍* ${prefix}tiktokstalk
*┊❍* ${prefix}mlstalk
*┊❍* ${prefix}npmstalk
*┊❍* ${prefix}ghstalk
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.stickermenu = (prefix) => {
return `
*╭────❍* Sticker *❍*
*┊❍* ${prefix}goose ??
*┊❍* ${prefix}woof
*┊❍* ${prefix}8ball
*┊❍* ${prefix}lizard
*┊❍* ${prefix}meow
*┊❍* ${prefix}gura
*┊❍* ${prefix}doge
*┊❍* ${prefix}patrick
*┊❍* ${prefix}lovestick
*┊❍* ${prefix}telestick
*┊❍* ${prefix}ttp
*┊❍* ${prefix}attp
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.databasemenu = (prefix) => {
return `
*╭────❍* Database *❍*
*┊❍* ${prefix}setcmd
*┊❍* ${prefix}delcmd
*┊❍* ${prefix}listcmd
*┊❍* ${prefix}lockcmd
*┊❍* ${prefix}addmsg
*┊❍* ${prefix}delmsg
*┊❍* ${prefix}getmsg
*┊❍* ${prefix}listmsg
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.aimenu = (prefix) => {
return `
*╭────❍* OpenAI *❍*
*┊❍* ${prefix}openai
*┊❍* ${prefix}blackboxai
*┊❍* ${prefix}bardai
*┊❍* ${prefix}lamaai
*┊❍* ${prefix}geminiai
*┊❍* ${prefix}photoleapai
*┊❍* ${prefix}mathsai
*┊❍* ${prefix}colorize
*┊❍* ${prefix}enhance
*┊❍* ${prefix}dehaze
*┊❍* ${prefix}dalle
*┊❍* ${prefix}ai
*┊❍* ${prefix}remini
*┊❍* ${prefix}Flux
*┊❍* ${prefix}shorturl
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.bugmenu = (prefix) => {
return `
*╭────❍* Bug & War *❍*
*┊❍* ${prefix}amountbug 
*┊❍* ${prefix}pmbug 
*┊❍* ${prefix}delaybug 
*┊❍* ${prefix}docubug 
*┊❍* ${prefix}unlimitedbug 
*┊❍* ${prefix}bombug 
*┊❍* ${prefix}lagbug 
*┊❍* ${prefix}trollybug 
*┊❍* ${prefix}gcbug 
*┊❍* ${prefix}delaygcbug 
*┊❍* ${prefix}laggcbug 
*┊❍* ${prefix}bomgcbug 
*┊❍* ${prefix}unlimitedgcbug 
*┊❍* ${prefix}trollygcbug 
*┊❍* ${prefix}docugcbug 
*┊❍* ${prefix}verif 
*┊❍* ${prefix}banv1 
*┊❍* ${prefix}banv2 
*┊❍* ${prefix}banv3 
*┊❍* ${prefix}banv4 
*┊❍* ${prefix}banv5 
*┊❍* ${prefix}banv6 
*┊❍* ${prefix}unbanv1 
*┊❍* ${prefix}unbanv2 
*┊❍* ${prefix}unbanv3 
*┊❍* ${prefix}unbanv4 
*┊❍* ${prefix}unbanv5 
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.randphotomenu = (prefix) => {
return `
*╭────❍* Random Photo *❍*
*┊❍* ${prefix}aesthetic
*┊❍* ${prefix}coffee
*┊❍* ${prefix}wikimedia
*┊❍* ${prefix}wallpaper
*┊❍* ${prefix}art
*┊❍* ${prefix}bts
*┊❍* ${prefix}dogwoof
*┊❍* ${prefix}catmeow
*┊❍* ${prefix}lizardpic
*┊❍* ${prefix}goosebird
*┊❍* ${prefix}8ballpool
*┊❍* ${prefix}cosplay
*┊❍* ${prefix}hacker
*┊❍* ${prefix}cyber
*┊❍* ${prefix}gamewallpaper
*┊❍* ${prefix}islamic
*┊❍* ${prefix}jennie
*┊❍* ${prefix}jiso
*┊❍* ${prefix}satanic
*┊❍* ${prefix}justina
*┊❍* ${prefix}cartoon
*┊❍* ${prefix}pentol
*┊❍* ${prefix}cat
*┊❍* ${prefix}kpop
*┊❍* ${prefix}exo
*┊❍* ${prefix}lisa
*┊❍* ${prefix}space
*┊❍* ${prefix}car
*┊❍* ${prefix}technology
*┊❍* ${prefix}bike
*┊❍* ${prefix}shortquote
*┊❍* ${prefix}antiwork
*┊❍* ${prefix}hacking
*┊❍* ${prefix}boneka
*┊❍* ${prefix}rose
*┊❍* ${prefix}ryujin
*┊❍* ${prefix}ulzzangboy
*┊❍* ${prefix}ulzzanggirl
*┊❍* ${prefix}wallml
*┊❍* ${prefix}wallphone
*┊❍* ${prefix}mountain
*┊❍* ${prefix}goose
*┊❍* ${prefix}profilepic
*┊❍* ${prefix}couplepp
*┊❍* ${prefix}programming
*┊❍* ${prefix}pubg
*┊❍* ${prefix}blackpink
*┊❍* ${prefix}randomboy  
*┊❍* ${prefix}randomgirl
*┊❍* ${prefix}hijab  
*┊❍* ${prefix}chinese
*┊❍* ${prefix}indo
*┊❍* ${prefix}japanese
*┊❍* ${prefix}korean
*┊❍* ${prefix}malay
*┊❍* ${prefix}thai
*┊❍* ${prefix}vietnamese
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.randvideomenu = (prefix) => {
return `
*╭────❍* Random Video *❍*
*┊❍* ${prefix}tiktokgirl
*┊❍* ${prefix}tiktoknukthy
*┊❍* ${prefix}tiktokkayes
*┊❍* ${prefix}tiktokpanrika
*┊❍* ${prefix}tiktoknotnot
*┊❍* ${prefix}tiktokghea
*┊❍* ${prefix}tiktoksantuy
*┊❍* ${prefix}tiktokbocil
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.photooxymenu = (prefix) => {
return `
*╭────❍* PhotoOxy Maker *❍*
*┊❍* ${prefix}shadow 
*┊❍* ${prefix}write 
*┊❍* ${prefix}romantic 
*┊❍* ${prefix}burnpaper
*┊❍* ${prefix}smoke 
*┊❍* ${prefix}narutobanner 
*┊❍* ${prefix}love 
*┊❍* ${prefix}undergrass
*┊❍* ${prefix}doublelove 
*┊❍* ${prefix}coffecup
*┊❍* ${prefix}underwaterocean
*┊❍* ${prefix}smokyneon
*┊❍* ${prefix}starstext
*┊❍* ${prefix}rainboweffect
*┊❍* ${prefix}balloontext
*┊❍* ${prefix}metalliceffect
*┊❍* ${prefix}embroiderytext
*┊❍* ${prefix}flamingtext
*┊❍* ${prefix}stonetext
*┊❍* ${prefix}writeart
*┊❍* ${prefix}summertext
*┊❍* ${prefix}wolfmetaltext
*┊❍* ${prefix}nature3dtext
*┊❍* ${prefix}rosestext
*┊❍* ${prefix}naturetypography
*┊❍* ${prefix}quotesunder
*┊❍* ${prefix}shinetext
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.ephoto360menu = (prefix) => {
return `
*╭────❍* Ephoto360 Maker *❍*
*┊❍* ${prefix}glitchtext
*┊❍* ${prefix}writetext
*┊❍* ${prefix}advancedglow
*┊❍* ${prefix}typographytext
*┊❍* ${prefix}pixelglitch
*┊❍* ${prefix}neonglitch
*┊❍* ${prefix}flagtext
*┊❍* ${prefix}flag3dtext
*┊❍* ${prefix}deletingtext
*┊❍* ${prefix}blackpinkstyle
*┊❍* ${prefix}glowingtext
*┊❍* ${prefix}underwatertext
*┊❍* ${prefix}logomaker
*┊❍* ${prefix}cartoonstyle
*┊❍* ${prefix}papercutstyle
*┊❍* ${prefix}watercolortext
*┊❍* ${prefix}effectclouds
*┊❍* ${prefix}blackpinklogo
*┊❍* ${prefix}gradienttext
*┊❍* ${prefix}summerbeach
*┊❍* ${prefix}luxurygold
*┊❍* ${prefix}multicoloredneon
*┊❍* ${prefix}sandsummer
*┊❍* ${prefix}galaxywallpaper
*┊❍* ${prefix}1917style
*┊❍* ${prefix}makingneon
*┊❍* ${prefix}royaltext
*┊❍* ${prefix}freecreate
*┊❍* ${prefix}galaxystyle
*┊❍* ${prefix}lighteffects
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.makermenu = (prefix) => {
return `
*╭────❍* Maker *❍*
*┊❍* ${prefix}blur
*┊❍* ${prefix}beautiful
*┊❍* ${prefix}facepalm
*┊❍* ${prefix}invert
*┊❍* ${prefix}pixelate
*┊❍* ${prefix}rainbow
*┊❍* ${prefix}trigger
*┊❍* ${prefix}wanted
*┊❍* ${prefix}wasted
*┊❍* ${prefix}carbon
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

global.nsfwmenu = (prefix) => {
return `
*╭────❍* Anime NSFW *❍*
*┊❍* ${prefix}hentai
*┊❍* ${prefix}gifhentai
*┊❍* ${prefix}gifblowjob
*┊❍* ${prefix}hentaivid
*┊❍* ${prefix}hneko
*┊❍* ${prefix}nwaifu
*┊❍* ${prefix}animespank
*┊❍* ${prefix}trap
*┊❍* ${prefix}blowjob
*┊❍* ${prefix}cuckold
*┊❍* ${prefix}milf
*┊❍* ${prefix}eba
*┊❍* ${prefix}gangbang
*┊❍* ${prefix}nsfwloli
*┊❍* ${prefix}pussy
*┊❍* ${prefix}yuri
*┊❍* ${prefix}zettai
*╰═════════════❍*
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ©*`}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})