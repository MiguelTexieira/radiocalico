// Test if JavaScript is running
console.log("JavaScript is running!");

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize debug log
  const debugLogElement = document.getElementById("debugLog");
  if (debugLogElement) {
    debugLogElement.textContent = "Debug Log:\n- JavaScript started executing";
  }

  function addLog(message) {
    const debugLog = document.getElementById("debugLog");
    if (debugLog) {
      debugLog.textContent += "\n- " + message;
    }
  }

  addLog("Setting up configuration...");

  // Configuration
  const STREAM_URLS = {
    master: "https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8",
    aac_hifi: "https://d3d4yli4hf5bmh.cloudfront.net/hls/aac_hifi.m3u8",
    flac_hires: "https://d3d4yli4hf5bmh.cloudfront.net/hls/flac_hires.m3u8",
  };
  const METADATA_URL =
    "https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json";
  const ALBUM_ART_URL = "https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg";

  addLog("Getting DOM elements...");

  // DOM Elements (declare first)
  let audioPlayer,
    playButton,
    playIcon,
    volumeControl,
    statusDisplay,
    errorMessage,
    debugLog,
    elapsedTimeDisplay,
    trackTitle,
    trackArtist,
    trackAlbum,
    audioQuality,
    trackExtra,
    sourceQuality,
    tracksList,
    albumArt,
    albumArtPlaceholder,
    thumbsUpBtn,
    thumbsDownBtn,
    thumbsUpCount,
    thumbsDownCount,
    ratingInfo;

  try {
    audioPlayer = document.getElementById("audioPlayer");
    addLog("Got audioPlayer");
    playButton = document.getElementById("playButton");
    addLog("Got playButton");
    playIcon = document.getElementById("playIcon");
    addLog("Got playIcon");
    volumeControl = document.getElementById("volumeControl");
    addLog("Got volumeControl");
    statusDisplay = document.getElementById("statusDisplay");
    addLog("Got statusDisplay");
    errorMessage = document.getElementById("errorMessage");
    addLog("Got errorMessage");
    debugLog = document.getElementById("debugLog");
    addLog("Got debugLog");
    elapsedTimeDisplay = document.getElementById("elapsedTime");
    addLog("Got elapsedTime");
    trackTitle = document.getElementById("trackTitle");
    addLog("Got trackTitle");
    trackArtist = document.getElementById("trackArtist");
    addLog("Got trackArtist");
    trackAlbum = document.getElementById("trackAlbum");
    addLog("Got trackAlbum");
    audioQuality = document.getElementById("audioQuality");
    addLog("Got audioQuality");
    trackExtra = document.getElementById("trackExtra");
    addLog("Got trackExtra");
    sourceQuality = document.getElementById("sourceQuality");
    addLog("Got sourceQuality");
    tracksList = document.getElementById("tracksList");
    addLog("Got tracksList");
    albumArt = document.getElementById("albumArt");
    addLog("Got albumArt");
    albumArtPlaceholder = document.getElementById("albumArtPlaceholder");
    addLog("Got albumArtPlaceholder");
    thumbsUpBtn = document.getElementById("thumbsUpBtn");
    addLog("Got thumbsUpBtn");
    thumbsDownBtn = document.getElementById("thumbsDownBtn");
    addLog("Got thumbsDownBtn");
    thumbsUpCount = document.getElementById("thumbsUpCount");
    addLog("Got thumbsUpCount");
    thumbsDownCount = document.getElementById("thumbsDownCount");
    addLog("Got thumbsDownCount");
    ratingInfo = document.getElementById("ratingInfo");
    addLog("Got ratingInfo");
    addLog("All DOM elements retrieved successfully");
  } catch (error) {
    addLog("Error getting DOM elements: " + error.message);
  }

  addLog("Setting up state variables...");

  // State
  let hls = null;
  let isPlaying = false;
  let isLoading = false;
  let startTime = null;
  let elapsedSeconds = 0;
  let timerInterval = null;
  let metadataInterval = null;
  let currentTrackInfo = {};
  let songRatings = {}; // In-memory storage for ratings
  let userVotes = {}; // Track user votes to prevent duplicates

  addLog("Generating user ID...");
  let userId = generateUserId(); // Generate unique user ID for session
  addLog("User ID generated: " + userId);

  addLog("Defining functions...");

  // Debug logging
  function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    if (debugLog) {
      debugLog.textContent += `\n[${timestamp}] ${message}`;
      debugLog.scrollTop = debugLog.scrollHeight;
    }
    console.log(`[Radio Player] ${message}`);
    // Also show in alert for critical errors
    if (message.includes("failed") || message.includes("error")) {
      console.error(`[Radio Player ERROR] ${message}`);
    }
  }

  // Generate unique user ID for session
  function generateUserId() {
    // Check if user ID exists in localStorage, if not create one
    let id = localStorage.getItem("radioUserID");
    if (!id) {
      id =
        "user_" +
        Math.random().toString(36).substr(2, 9) +
        "_" +
        Date.now();
      localStorage.setItem("radioUserID", id);
    }
    return id;
  }

  // Create song ID from artist and title
  function createSongId(artist, title) {
    return btoa(`${artist}|${title}`).replace(/[^a-zA-Z0-9]/g, "");
  }

  // Database API functions
  async function registerUser(userId) {
    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      log(`User registered: ${userId}`);
      return data.success;
    } catch (error) {
      log(`User registration error: ${error.message}`);
      return false;
    }
  }

  async function saveSongRating(
    songId,
    rating,
    userId,
    artist,
    title,
    album = null
  ) {
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          artist: artist,
          title: title,
          album: album,
          rating: rating,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      log(`Vote saved: ${rating} for song ${songId}`);
      return data.data;
    } catch (error) {
      log(`Save rating error: ${error.message}`);
      throw error;
    }
  }

  async function getSongRating(artist, title, userId) {
    try {
      const encodedArtist = encodeURIComponent(artist);
      const encodedTitle = encodeURIComponent(title);
      const url = `/api/ratings/${encodedArtist}/${encodedTitle}?user_id=${encodeURIComponent(
        userId
      )}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        up: data.data.thumbs_up || 0,
        down: data.data.thumbs_down || 0,
        userVote: data.data.user_vote,
      };
    } catch (error) {
      log(`Get rating error: ${error.message}`);
      return { up: 0, down: 0, userVote: null };
    }
  }

  // Rating UI functions
  async function updateRatingDisplay(artist, title) {
    if (!artist || !title) {
      // Set defaults for loading state
      if (thumbsUpCount) thumbsUpCount.textContent = "0";
      if (thumbsDownCount) thumbsDownCount.textContent = "0";
      if (thumbsUpBtn) thumbsUpBtn.classList.remove("voted");
      if (thumbsDownBtn) thumbsDownBtn.classList.remove("voted");
      if (ratingInfo) ratingInfo.innerHTML = `<span class="rating-text">Rate this song</span>`;
      return;
    }

    try {
      const rating = await getSongRating(artist, title, userId);

      // Update counts
      if (thumbsUpCount) thumbsUpCount.textContent = rating.up.toString();
      if (thumbsDownCount) thumbsDownCount.textContent = rating.down.toString();

      // Update button states
      if (thumbsUpBtn) thumbsUpBtn.classList.toggle("voted", rating.userVote === "up");
      if (thumbsDownBtn) thumbsDownBtn.classList.toggle("voted", rating.userVote === "down");

      // Update info text
      const totalVotes = rating.up + rating.down;
      if (ratingInfo) {
        if (rating.userVote) {
          ratingInfo.innerHTML = `<span class="rating-text">You ${
            rating.userVote === "up" ? "liked" : "disliked"
          } this song</span>`;
        } else if (totalVotes > 0) {
          ratingInfo.innerHTML = `<span class="rating-text">${totalVotes} ${
            totalVotes === 1 ? "vote" : "votes"
          } total</span>`;
        } else {
          ratingInfo.innerHTML = `<span class="rating-text">Rate this song</span>`;
        }
      }
    } catch (error) {
      log(`Error updating rating display: ${error.message}`);
      if (ratingInfo) ratingInfo.innerHTML = `<span class="rating-text">Rate this song</span>`;
    }
  }

  async function handleRating(ratingType) {
    if (!currentTrackInfo.title || !currentTrackInfo.artist) {
      log("No current track to rate");
      return;
    }

    // Disable buttons to prevent double-clicking
    if (thumbsUpBtn) thumbsUpBtn.disabled = true;
    if (thumbsDownBtn) thumbsDownBtn.disabled = true;

    try {
      const songId = createSongId(
        currentTrackInfo.artist,
        currentTrackInfo.title
      );

      // Save the rating
      const updatedRating = await saveSongRating(
        songId,
        ratingType,
        userId,
        currentTrackInfo.artist,
        currentTrackInfo.title,
        currentTrackInfo.album
      );

      // Update display with returned data
      if (thumbsUpCount) thumbsUpCount.textContent = updatedRating.thumbs_up.toString();
      if (thumbsDownCount) thumbsDownCount.textContent = updatedRating.thumbs_down.toString();

      // Update button states based on new vote
      if (thumbsUpBtn) thumbsUpBtn.classList.toggle("voted", ratingType === "up");
      if (thumbsDownBtn) thumbsDownBtn.classList.toggle("voted", ratingType === "down");

      // Update info text
      const totalVotes =
        updatedRating.thumbs_up + updatedRating.thumbs_down;
      if (ratingInfo) {
        ratingInfo.innerHTML = `<span class="rating-text">You ${
          ratingType === "up" ? "liked" : "disliked"
        } this song</span>`;
      }

      // Add visual feedback
      const btn = ratingType === "up" ? thumbsUpBtn : thumbsDownBtn;
      if (btn) {
        btn.style.transform = "scale(1.1)";
        setTimeout(() => {
          btn.style.transform = "";
        }, 150);
      }

      log(
        `User voted ${ratingType} for "${currentTrackInfo.artist} - ${currentTrackInfo.title}"`
      );
    } catch (error) {
      log(`Error handling rating: ${error.message}`);
      showError(`Failed to save rating: ${error.message}`);
    } finally {
      // Re-enable buttons
      if (thumbsUpBtn) thumbsUpBtn.disabled = false;
      if (thumbsDownBtn) thumbsDownBtn.disabled = false;
    }
  }

  // Format seconds to HH:MM:SS
  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((v) => (v < 10 ? "0" + v : v))
      .join(":");
  }

  // Start timer
  function startTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    startTime = Date.now() - elapsedSeconds * 1000;

    timerInterval = setInterval(() => {
      const now = Date.now();
      elapsedSeconds = Math.floor((now - startTime) / 1000);
      if (elapsedTimeDisplay) elapsedTimeDisplay.textContent = formatTime(elapsedSeconds);
    }, 1000);

    log("Timer started");
  }

  // Stop timer
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      log("Timer paused");
    }
  }

  // Reset timer
  function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    if (elapsedTimeDisplay) elapsedTimeDisplay.textContent = "00:00:00";
    log("Timer reset");
  }

  // Handle album art loading
  function refreshAlbumArt() {
    // Add timestamp to force refresh and bypass cache
    const timestamp = Date.now();
    const newSrc = `${ALBUM_ART_URL}?t=${timestamp}`;

    log("Refreshing album art...");

    // Create a new image to test loading
    const testImg = new Image();

    testImg.onload = () => {
      if (albumArt) {
        albumArt.src = newSrc;
        albumArt.style.display = "block";
      }
      if (albumArtPlaceholder) albumArtPlaceholder.classList.remove("show");
      log("Album art loaded successfully");
    };

    testImg.onerror = () => {
      if (albumArt) albumArt.style.display = "none";
      if (albumArtPlaceholder) albumArtPlaceholder.classList.add("show");
      log("Album art failed to load, showing placeholder");
    };

    testImg.src = newSrc;
  }

  // Initialize album art
  function initializeAlbumArt() {
    if (albumArt) {
      albumArt.onerror = () => {
        albumArt.style.display = "none";
        if (albumArtPlaceholder) albumArtPlaceholder.classList.add("show");
        log("Album art error, showing placeholder");
      };

      albumArt.onload = () => {
        albumArt.style.display = "block";
        if (albumArtPlaceholder) albumArtPlaceholder.classList.remove("show");
        log("Album art loaded");
      };
    }

    // Test initial load
    refreshAlbumArt();
  }

  // Fetch and update metadata
  async function fetchMetadata() {
    try {
      log("Fetching metadata from: " + METADATA_URL);
      const response = await fetch(METADATA_URL);
      if (!response.ok) throw new Error("Failed to fetch metadata");

      const data = await response.json();
      log("Metadata received: " + JSON.stringify(data));

      // Always update on first load, or if track has changed
      const isFirstLoad =
        currentTrackInfo.title === "Loading..." ||
        currentTrackInfo.title === "Fetching current track...";
      const hasTrackChanged =
        data.title !== currentTrackInfo.title ||
        data.artist !== currentTrackInfo.artist;

      if (isFirstLoad || hasTrackChanged) {
        log(
          `${isFirstLoad ? "First load" : "New track"}: ${data.artist} - ${
            data.title
          }`
        );

        // Update current track info
        currentTrackInfo = data;

        // Update UI
        if (trackTitle) trackTitle.textContent = data.title || "Unknown Title";
        if (trackArtist) trackArtist.textContent = data.artist || "Unknown Artist";
        if (trackAlbum) {
          trackAlbum.textContent =
            data.album && data.album !== data.title
              ? `${data.album}${data.date ? ` (${data.date})` : ""}`
              : data.date || "";
        }

        // Update track details
        if (trackExtra) {
          if (data.album && data.album !== data.title) {
            trackExtra.textContent = data.album;
          } else {
            trackExtra.textContent = "";
          }
        }

        // Update source quality info
        if (data.bit_depth && data.sample_rate && sourceQuality && audioQuality) {
          const sampleRateKhz = data.sample_rate / 1000;
          sourceQuality.textContent = `Source quality: ${data.bit_depth}-bit ${sampleRateKhz}kHz`;
          audioQuality.textContent = `Stream quality: 48kHz FLAC / HLS Lossless`;
        }

        // Add animation for track change
        if (trackTitle) {
          trackTitle.style.animation = "none";
          setTimeout(() => {
            trackTitle.style.animation = "fadeIn 0.5s ease";
          }, 10);
        }

        // Refresh album art for new track
        refreshAlbumArt();

        // Update rating display for new track
        updateRatingDisplay(data.artist, data.title);
      }

      // Update previous tracks
      updatePreviousTracks(data);
    } catch (error) {
      log(`Metadata fetch error: ${error.message}`);
    }
  }

  // Update previous tracks display
  function updatePreviousTracks(data) {
    const previousTracks = [];

    // Collect previous tracks from metadata
    for (let i = 1; i <= 5; i++) {
      const artist = data[`prev_artist_${i}`];
      const title = data[`prev_title_${i}`];

      if (artist && title) {
        previousTracks.push({ artist, title });
      }
    }

    // Only update if we have tracks
    if (previousTracks.length > 0 && tracksList) {
      // Clear and rebuild the tracks list
      tracksList.innerHTML = "";

      previousTracks.forEach((track, index) => {
        const trackItem = document.createElement("div");
        trackItem.className = "track-item";

        // Add animation class for new items
        if (currentTrackInfo.prevTracksCount !== previousTracks.length) {
          trackItem.classList.add("new");
        }

        trackItem.innerHTML = `
          <span class="track-number">${track.artist}:</span>
          <div class="track-details">
              <div class="track-artist-title">
                  <div class="artist">${track.title}</div>
              </div>
          </div>
        `;

        tracksList.appendChild(trackItem);
      });

      // Store count for comparison
      currentTrackInfo.prevTracksCount = previousTracks.length;
    }
  }

  // Start metadata updates
  function startMetadataUpdates() {
    // Fetch immediately
    fetchMetadata();

    // Then fetch every 5 seconds
    if (metadataInterval) {
      clearInterval(metadataInterval);
    }
    metadataInterval = setInterval(fetchMetadata, 5000);
    log("Started metadata updates");
  }

  // Stop metadata updates
  function stopMetadataUpdates() {
    if (metadataInterval) {
      clearInterval(metadataInterval);
      metadataInterval = null;
      log("Stopped metadata updates");
    }
  }

  // Update UI status
  function updateStatus(message, type = "normal") {
    if (statusDisplay) {
      statusDisplay.textContent = message;
      statusDisplay.className = "status-display";

      if (type === "connected") {
        statusDisplay.classList.add("connected");
      } else if (type === "playing") {
        statusDisplay.classList.add("playing");
      } else if (type === "error") {
        statusDisplay.classList.add("error");
      }
    }

    log(`Status: ${message}`);
  }

  // Show error message
  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
    }
    updateStatus("Error occurred", "error");
    log(`ERROR: ${message}`);
  }

  // Hide error message
  function hideError() {
    if (errorMessage) errorMessage.style.display = "none";
  }

  // Initialize HLS with fallback streams
  function initializeHLS(streamUrl = null, attemptNumber = 0) {
    const streamOptions = [
      { url: STREAM_URLS.aac_hifi, name: "AAC Hi-Fi" }, // Try AAC first (more compatible)
      { url: STREAM_URLS.master, name: "Master Playlist" },
      { url: STREAM_URLS.flac_hires, name: "FLAC Lossless" }, // FLAC last (least compatible)
    ];

    const currentStream =
      streamUrl ||
      streamOptions[attemptNumber]?.url ||
      STREAM_URLS.aac_hifi;
    const streamName = streamOptions[attemptNumber]?.name || "Stream";

    log(`Initializing HLS.js with ${streamName}...`);

    if (Hls.isSupported()) {
      log("HLS.js is supported");

      // Destroy existing instance
      if (hls) {
        hls.destroy();
        hls = null;
      }

      // Create HLS instance with optimized configuration
      hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 60,
        maxMaxBufferLength: 300,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 3,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        enableWebVTT: false,
        enableCEA708Captions: false,
        stretchShortVideoTrack: false,
        forceKeyFrameOnDiscontinuity: true,
        abrEwmaFastLive: 3,
        abrEwmaSlowLive: 9,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        maxStarvationDelay: 4,
        maxLoadingDelay: 4,
        minAutoBitrate: 0,
        testBandwidth: false,
        progressive: false,
        // Add retry configuration
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 500,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 500,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 500,
      });

      // Attach event listeners
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        log("Media attached successfully");
        hls.loadSource(currentStream);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        log(`Manifest parsed: ${data.levels.length} quality levels found`);
        updateStatus(`Stream ready (${streamName})`, "connected");
        hideError();
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        log(`Level loaded: ${data.details.totalduration || "Live"}s`);
      });

      hls.on(Hls.Events.AUDIO_TRACK_LOADED, (event, data) => {
        log("Audio track loaded successfully");
      });

      hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        // Fragment loaded successfully - stream is working
        if (attemptNumber > 0) {
          log(
            `Stream working with ${streamName} after ${attemptNumber} attempts`
          );
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        log(
          `HLS Error: Type=${data.type}, Details=${data.details}, Fatal=${data.fatal}`
        );

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              log("Fatal network error - trying fallback...");
              if (attemptNumber < streamOptions.length - 1) {
                showError(
                  `Network error with ${streamName} - trying fallback...`
                );
                setTimeout(() => {
                  initializeHLS(null, attemptNumber + 1);
                }, 2000);
              } else {
                showError("All streams failed - check your connection");
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              log("Fatal media error - attempting recovery...");
              showError(
                `Media error with ${streamName} - attempting recovery...`
              );
              try {
                hls.recoverMediaError();
              } catch (e) {
                if (attemptNumber < streamOptions.length - 1) {
                  setTimeout(() => {
                    initializeHLS(null, attemptNumber + 1);
                  }, 2000);
                } else {
                  showError(
                    "Media recovery failed - try refreshing the page"
                  );
                }
              }
              break;
            default:
              log("Fatal error - trying fallback stream...");
              if (attemptNumber < streamOptions.length - 1) {
                showError(`${streamName} failed - trying fallback...`);
                setTimeout(() => {
                  initializeHLS(null, attemptNumber + 1);
                }, 2000);
              } else {
                showError("All streams failed - please reload the page");
                if (hls) {
                  hls.destroy();
                  hls = null;
                }
              }
              break;
          }
        } else {
          // Non-fatal error - log but continue
          log(`Non-fatal HLS error: ${data.details}`);
        }
      });

      // Attach HLS to audio element
      if (audioPlayer) hls.attachMedia(audioPlayer);
    } else if (audioPlayer && audioPlayer.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support - try AAC first
      log("Using native HLS support (Safari)");
      audioPlayer.src = currentStream;
      updateStatus(
        `Stream ready (Native HLS - ${streamName})`,
        "connected"
      );
    } else {
      showError("HLS is not supported in your browser");
    }
  }

  // Play/Pause functionality
  function togglePlayback() {
    if (isLoading) {
      log("Already loading, please wait...");
      return;
    }

    if (!audioPlayer) {
      log("Audio player not found");
      return;
    }

    if (!isPlaying) {
      log("Starting playback...");
      isLoading = true;
      if (playButton) playButton.classList.add("loading");

      // Initialize HLS if not already done
      if (!hls && Hls.isSupported()) {
        initializeHLS();
      }

      audioPlayer
        .play()
        .then(() => {
          log("Playback started successfully");
          isPlaying = true;
          isLoading = false;
          if (playButton) playButton.classList.remove("loading");
          if (playIcon) playIcon.innerHTML =
            '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
          updateStatus("Playing", "playing");
          hideError();
        })
        .catch((error) => {
          log(`Playback failed: ${error.message}`);
          isLoading = false;
          if (playButton) playButton.classList.remove("loading");
          showError(`Playback failed: ${error.message}`);
        });
    } else {
      log("Pausing playback...");
      audioPlayer.pause();
      isPlaying = false;
      if (playIcon) playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
      updateStatus("Paused", "connected");
    }
  }

  // Volume control
  function updateVolume() {
    if (audioPlayer && volumeControl) {
      const volume = volumeControl.value / 100;
      audioPlayer.volume = volume;
      log(`Volume set to ${volumeControl.value}%`);
    }
  }

  // Event listeners
  if (playButton) playButton.addEventListener("click", togglePlayback);
  if (volumeControl) volumeControl.addEventListener("input", updateVolume);

  // Rating button event listeners
  if (thumbsUpBtn) thumbsUpBtn.addEventListener("click", () => handleRating("up"));
  if (thumbsDownBtn) thumbsDownBtn.addEventListener("click", () => handleRating("down"));

  // Audio element events
  if (audioPlayer) {
    audioPlayer.addEventListener("loadstart", () => {
      log("Loading stream...");
      updateStatus("Loading stream...", "normal");
    });

    audioPlayer.addEventListener("canplay", () => {
      log("Stream can play");
      updateStatus("Ready to play", "connected");
    });

    audioPlayer.addEventListener("waiting", () => {
      log("Buffering...");
      updateStatus("Buffering...", "normal");
    });

    audioPlayer.addEventListener("playing", () => {
      log("Stream is playing");
      isPlaying = true;
      isLoading = false;
      if (playButton) playButton.classList.remove("loading");
      updateStatus("Playing", "playing");
      startTimer();
      startMetadataUpdates();
    });

    audioPlayer.addEventListener("pause", () => {
      log("Stream paused");
      isPlaying = false;
      updateStatus("Paused", "connected");
      stopTimer();
      stopMetadataUpdates();
    });

    audioPlayer.addEventListener("error", (e) => {
      const error = e.target.error;
      let errorMsg = "Unknown error";

      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMsg = "Playback aborted";
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMsg = "Network error";
            break;
          case error.MEDIA_ERR_DECODE:
            errorMsg = "Decoding error";
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = "Source not supported";
            break;
        }
      }

      showError(`Audio error: ${errorMsg}`);
      stopTimer();
      stopMetadataUpdates();
      isPlaying = false;
      if (playIcon) playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    });
  }

  addLog("Starting initialization...");

  // Initialize volume
  addLog("Updating volume...");
  updateVolume();
  addLog("Volume updated");

  // Initialize HLS on page load for better readiness
  addLog("Initializing player...");
  addLog("User ID: " + userId);
  addLog("METADATA_URL: " + METADATA_URL);

  // Register user with database
  addLog("Registering user...");
  registerUser(userId);
  addLog("User registration initiated");

  addLog("Initializing HLS...");
  initializeHLS();
  addLog("HLS initialization started");

  // Set initial track info from HTML content for rating system
  addLog("Setting initial track info...");
  currentTrackInfo = {
    title: trackTitle ? trackTitle.textContent : "Loading...",
    artist: trackArtist ? trackArtist.textContent : "Loading...",
    album: trackAlbum ? trackAlbum.textContent : "",
  };
  addLog("Initial track info set: " + JSON.stringify(currentTrackInfo));

  // Initialize album art
  addLog("Initializing album art...");
  initializeAlbumArt();
  addLog("Album art initialization started");

  // Initialize rating display
  addLog("Initializing rating display...");
  updateRatingDisplay(null, null);
  addLog("Rating display initialized");

  // Test metadata fetch immediately
  addLog("Testing metadata fetch...");
  fetch(METADATA_URL)
    .then((response) => {
      addLog("Metadata response status: " + response.status);
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      addLog(
        "Metadata test successful: " + data.artist + " - " + data.title
      );
      // Update UI immediately with real data
      if (trackTitle) trackTitle.textContent = data.title || "Unknown Title";
      if (trackArtist) trackArtist.textContent = data.artist || "Unknown Artist";
      if (trackAlbum) {
        trackAlbum.textContent =
          data.album && data.album !== data.title
            ? `${data.album}${data.date ? ` (${data.date})` : ""}`
            : data.date || "";
      }

      // Now start regular updates
      startMetadataUpdates();
    })
    .catch((error) => {
      addLog("Metadata test failed: " + error.message);
      // Fallback - try starting updates anyway
      startMetadataUpdates();
    });
});