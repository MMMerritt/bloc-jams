var setSong = function(songNumber) {
  if (currentSoundFile) {
         currentSoundFile.stop();
     }

  currentlyPlayingSongNumber = parseInt(songNumber);
  currentSongFromAlbum = currentAlbum.songs[songNumber - 1];

  currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
         // #2
         formats: [ 'mp3' ],
         preload: true
  });

  setVolume(currentVolume);
};

var seek = function(time) {
     if (currentSoundFile) {
         currentSoundFile.setTime(time);
     }
 }

var setVolume = function(volume) {
     if (currentSoundFile) {
         currentSoundFile.setVolume(volume);
     }
 };

var getSongNumberCell = function(number) {
  return $('.song-item-number[data-song-number="' + number + '"]');
};

 var createSongRow = function(songNumber, songName, songLength) {
     var songLengthMinSec = filterTimeCode(songLength);
     var template =
        '<tr class="album-view-song-item">'
      + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
      + '  <td class="song-item-title">' + songName + '</td>'
      + '  <td class="song-item-duration">' + songLengthMinSec + '</td>'
      + '</tr>'
      ;

     var $row = $(template);

     var clickHandler = function() {
         var songNumber = parseInt($(this).attr('data-song-number'));

         if (currentlyPlayingSongNumber !== null) {
           var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);

		       currentlyPlayingCell.html(currentlyPlayingSongNumber);
         }
         if (currentlyPlayingSongNumber !== songNumber) {
		       // Switch from Play -> Pause button to indicate new song is playing.
		       setSong(songNumber);
           currentSoundFile.play();
           updateSeekBarWhileSongPlays();

           currentSongFromAlbum = currentAlbum.songs[songNumber - 1];

           var $volumeFill = $('.volume .fill');
           var $volumeThumb = $('.volume .thumb');
           $volumeFill.width(currentVolume + '%');
           $volumeThumb.css({left: currentVolume + '%'});

           $(this).html(pauseButtonTemplate);
           updatePlayerBarSong();

	       } else if (currentlyPlayingSongNumber === songNumber) {
		       if (currentSoundFile.isPaused()) {
             $(this).html(pauseButtonTemplate);
             $('.main-controls .play-pause').html(playerBarPauseButton);
             currentSoundFile.play();
             updateSeekBarWhileSongPlays();
           } else {
             $(this).html(playButtonTemplate);
             $('.main-controls .play-pause').html(playerBarPlayButton);
             currentSoundFile.pause();
           }
	       }
     };

     var onHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));

        if (songNumber !== currentlyPlayingSongNumber) {
          songNumberCell.html(playButtonTemplate);
        }
     };

     var offHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));

        if (songNumber !== currentlyPlayingSongNumber) {
          songNumberCell.html(songNumber);
        }
     };


     $row.find('.song-item-number').click(clickHandler);
     $row.hover(onHover, offHover);

     return $row;
 };

 var setCurrentAlbum = function(album) {
     currentAlbum = album;

     var $albumTitle = $('.album-view-title');
     var $albumArtist = $('.album-view-artist');
     var $albumReleaseInfo = $('.album-view-release-info');
     var $albumImage = $('.album-cover-art');
     var $albumSongList = $('.album-view-song-list');

     $albumTitle.text(album.title);
     $albumArtist.text(album.artist);
     $albumReleaseInfo.text(album.year + ' ' + album.label);
     $albumImage.attr('src', album.albumArtUrl);

     $albumSongList.empty();

     for (var i = 0; i < album.songs.length; i++) {
         var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
         $albumSongList.append($newRow);
     }
 };

 var updateSeekBarWhileSongPlays = function() {
     if (currentSoundFile) {

         currentSoundFile.bind('timeupdate', function(event) {

             var seekBarFillRatio = this.getTime() / this.getDuration();
             var $seekBar = $('.seek-control .seek-bar');
             var currentTime = filterTimeCode(this.getTime());

             updateSeekPercentage($seekBar, seekBarFillRatio);
             setCurrentTimeInPlayerBar(currentTime);
         });
     }
 };

 var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;

    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);

    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
 };

 var setCurrentTimeInPlayerBar = function(currentTime) {
    $('.currently-playing .current-time').html(currentTime);
 };

 var setupSeekBars = function() {
     var $seekBars = $('.player-bar .seek-bar');

     $seekBars.click(function(event) {

         var offsetX = event.pageX - $(this).offset().left;
         var barWidth = $(this).width();

         var seekBarFillRatio = offsetX / barWidth;

         if ($(this).parent().attr('class') == 'seek-control') {
             seek(seekBarFillRatio * currentSoundFile.getDuration());
           } else {
             setVolume(seekBarFillRatio * 100);
         }

         updateSeekPercentage($(this), seekBarFillRatio);
     });
     $seekBars.find('.thumb').mousedown(function(event) {

         var $seekBar = $(this).parent();


         $(document).bind('mousemove.thumb', function(event){
             var offsetX = event.pageX - $seekBar.offset().left;
             var barWidth = $seekBar.width();
             var seekBarFillRatio = offsetX / barWidth;

             updateSeekPercentage($seekBar, seekBarFillRatio);
         });


         $(document).bind('mouseup.thumb', function() {
             $(document).unbind('mousemove.thumb');
             $(document).unbind('mouseup.thumb');
         });
     });
 };

var trackIndex = function(album, song) {
    return album.songs.indexOf(song);
};

 var updatePlayerBarSong = function() {
   $('.currently-playing .song-name').text(currentSongFromAlbum.title);
   $('.currently-playing .artist-name').text(currentAlbum.artist);
   $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);

   $('.main-controls .play-pause').html(playerBarPauseButton);

   if (currentSoundFile) {
     currentSoundFile.bind('timeupdate', function(event) {
       var totalTime = filterTimeCode(this.getDuration());

       setTotalTimeInPlayerBar(totalTime);
     });
   }
 };

 var setTotalTimeInPlayerBar = function(totalTime) {
    $('.currently-playing .total-time').html(totalTime);
 };

 var filterTimeCode = function(timeInSeconds) {
   var timeInSecondsNum = parseFloat(timeInSeconds);
   var wholeMinutes = Math.floor(timeInSecondsNum / 60);
   var wholeSeconds = Math.floor(timeInSecondsNum % 60);

   if (wholeSeconds < 10) {
     return wholeMinutes + ":0" + wholeSeconds;
   } else {
     return wholeMinutes + ":" + wholeSeconds;
   };
 };

 var nextSong = function() {
   var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
   currentSongIndex++;

   if (currentSongIndex >= currentAlbum.songs.length) {
     currentSongIndex = 0;
   }

   var lastSongNumber = currentlyPlayingSongNumber;

   setSong(currentSongIndex + 1);
   currentSoundFile.play();

   updateSeekBarWhileSongPlays()

   updatePlayerBarSong();

   var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
   var $nextSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');

   $lastSongNumberCell.html(lastSongNumber);
   $nextSongNumberCell.html(pauseButtonTemplate);
 };

 var previousSong = function() {
   var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
   currentSongIndex--;

   if (currentSongIndex < 0) {
     currentSongIndex = currentAlbum.songs.length - 1;
   }

   var lastSongNumber = currentlyPlayingSongNumber;

   setSong(currentSongIndex + 1);
   currentSoundFile.play();

   updateSeekBarWhileSongPlays()

   updatePlayerBarSong();

   $('.main-controls .play-pause').html(playerBarPauseButton);

   var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
   var $previousSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');

   $lastSongNumberCell.html(lastSongNumber);
   $previousSongNumberCell.html(pauseButtonTemplate);
 };

 var togglePlayFromPlayerBar = function() {
   if (currentSoundFile.isPaused()) {
     var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);

     currentlyPlayingCell.html(pauseButtonTemplate);
     $playPauseButton.html(playerBarPauseButton);
     currentSoundFile.play();
   } else {
     var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);

     currentlyPlayingCell.html(playButtonTemplate);
     $playPauseButton.html(playerBarPlayButton);
     currentSoundFile.pause();
   }
 };

 var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
 var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
 var playerBarPlayButton = '<span class="ion-play"></span>';
 var playerBarPauseButton = '<span class="ion-pause"></span>';

 var currentAlbum = null;
 var currentlyPlayingSongNumber = null;
 var currentSongFromAlbum = null;
 var currentSoundFile = null;
 var currentVolume = 80;

 var $previousButton = $('.main-controls .previous');
 var $nextButton = $('.main-controls .next');
 var $playPauseButton = $('.main-controls .play-pause');

 $(document).ready(function() {
     setCurrentAlbum(albumPicasso);
     setupSeekBars();

     $previousButton.click(previousSong);
     $nextButton.click(nextSong);
     $playPauseButton.click(togglePlayFromPlayerBar);

 });
