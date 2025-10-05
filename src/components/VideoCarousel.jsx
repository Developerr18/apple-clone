import { useEffect, useRef, useState } from "react";
import { highlightsSlides } from "../constants";
import gsap from "gsap";
import { pauseImg, playImg, replayImg } from "../utils";
import { useGSAP } from "@gsap/react";
import _gsap from "gsap/gsap-core";

/**
 * VideoCarousel Component
 *
 * A sophisticated video carousel that displays multiple videos with smooth transitions,
 * progress indicators, and interactive controls. Features include:
 * - Smooth GSAP animations for video transitions
 * - Real-time progress tracking for each video
 * - Play/pause/replay controls
 * - Responsive design for different screen sizes
 */
const VideoCarousel = () => {
  // Refs for video elements and progress indicators
  const videoRef = useRef([]); // References to video DOM elements
  const videoSpanRef = useRef([]); // References to progress bar spans
  const videoDivRef = useRef([]); // References to progress indicator containers

  // State for tracking loaded video metadata
  const [loadedData, setLoadedData] = useState([]);

  // Main video state object
  const [video, setVideo] = useState({
    isEnd: false, // Whether current video has ended
    startPlay: false, // Whether to start playing the video
    videoId: 0, // Current video index
    isLastVideo: false, // Whether we're on the last video
    isPlaying: false, // Whether video is currently playing
  });

  const { isEnd, startPlay, videoId, isLastVideo, isPlaying } = video;

  // GSAP animation hook for video carousel transitions
  useGSAP(() => {
    // Animate the slider to show the current video
    gsap.to("#slider", {
      transform: `translateX(${-100 * videoId}%)`,
      duration: 2,
      ease: "power2.inOut",
    });

    // Set up scroll trigger for video element
    gsap.to("#video", {
      scrollTrigger: {
        trigger: "#video",
        toggleActions: "restart none none none",
      },
      onComplete: () => {
        // Start playing the video when animation completes
        setVideo((pre) => ({
          ...pre,
          startPlay: true,
          isPlaying: true,
        }));
      },
    });
  }, [isEnd, videoId]);

  // Effect to handle video play/pause based on state changes
  useEffect(() => {
    if (loadedData.length > 3) {
      if (!isPlaying) {
        videoRef.current[videoId].pause();
      } else {
        startPlay && videoRef.current[videoId].play();
      }
    }
  }, [startPlay, videoId, isPlaying, loadedData]);

  // Handler for when video metadata is loaded
  const handleLoadedMetadata = (i, e) => setLoadedData((pre) => [...pre, e]);

  // Effect to handle video progress animation and tracking
  useEffect(() => {
    let currentProgress = 0;
    let span = videoSpanRef.current;

    if (span[videoId]) {
      // Create animation for video progress bar
      let anim = gsap.to(span[videoId], {
        onUpdate: () => {
          const progress = Math.ceil(anim.progress() * 100);

          // Update progress bar when progress changes
          if (progress != currentProgress) {
            currentProgress = progress;

            // Animate progress indicator width based on screen size
            gsap.to(videoDivRef.current[videoId], {
              width:
                window.innerWidth < 760
                  ? "10vw"
                  : window.innerWidth < 1200
                  ? "10vw"
                  : "4vw",
            });

            // Update progress bar appearance
            gsap.to(span[videoId], {
              width: `${currentProgress}%`,
              backgroundColor: "white",
            });
          }
        },

        onComplete: () => {
          // Reset progress bar when animation completes
          if (isPlaying) {
            gsap.to(videoDivRef.current[videoId], {
              width: "12px",
            });
            gsap.to(span[videoId], {
              backgroundColor: "#afafaf",
            });
          }
        },
      });

      // Restart animation for the first video
      if (videoId === 0) {
        anim.restart();
      }

      // Function to update animation progress based on video current time
      const animUpdate = () => {
        anim.progress(
          videoRef.current[videoId].currentTime /
            highlightsSlides[videoId].videoDuration
        );
      };

      // Add or remove progress update ticker based on playing state
      if (isPlaying) {
        gsap.ticker.add(animUpdate);
      } else {
        gsap.ticker.remove(animUpdate);
      }
    }
  }, [videoId, startPlay]);

  // Handler for video control actions
  const handleProcess = (type, i) => {
    switch (type) {
      case "video-end":
        // Move to next video when current video ends
        setVideo((pre) => ({ ...pre, isEnd: true, videoId: i + 1 }));
        break;
      case "video-last":
        // Mark that we've reached the last video
        setVideo((pre) => ({ ...pre, isLastVideo: true }));
        break;
      case "video-reset":
        // Reset to first video and clear last video flag
        setVideo((pre) => ({ ...pre, isLastVideo: false, videoId: 0 }));
        break;
      case "play":
        // Toggle play state
        setVideo((pre) => ({ ...pre, isPlaying: !pre.isPlaying }));
        break;
      case "pause":
        // Toggle pause state
        setVideo((pre) => ({ ...pre, isPlaying: !pre.isPlaying }));
        break;
      default:
        return video;
    }
  };

  return (
    <>
      {/* Video Carousel Container */}
      <div className="flex items-center">
        {highlightsSlides.map((list, i) => (
          <div key={list.id} id="slider" className="sm:pr-20 pr-10">
            <div className="video-carousel_container">
              {/* Video Container */}
              <div className="w-full h-full flex-center rounded-3xl overflow-hidden bg-black">
                <video
                  id="video"
                  playsInline={true}
                  preload="auto"
                  muted
                  className={`${
                    list.id === 2 && "translate-x-44"
                  } pointer-events-none`}
                  ref={(el) => (videoRef.current[i] = el)}
                  onPlay={() => {
                    // Update playing state when video starts playing
                    setVideo((prevVideo) => ({
                      ...prevVideo,
                      isPlaying: true,
                    }));
                  }}
                  onEnded={() =>
                    // Handle video end - move to next or mark as last
                    i !== 3
                      ? handleProcess("video-end", i)
                      : handleProcess("video-last")
                  }
                  onLoadedMetadata={(e) => handleLoadedMetadata(i, e)}
                >
                  <source src={list.video} type="video/mp4" />
                </video>
              </div>

              {/* Video Text Overlay */}
              <div className="absolute top-12 left-[5%] z-10">
                {list.textLists.map((text) => (
                  <p key={text} className="md:text-2xl text-xl font-medium">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Controls and Progress Indicators */}
      <div className="relative flex-center mt-10">
        {/* Progress Indicators Container */}
        <div className="flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full">
          {videoRef.current.map((_, i) => (
            <span
              key={i}
              ref={(el) => (videoDivRef.current[i] = el)}
              className="mx-2 w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer"
            >
              {/* Progress Bar Span */}
              <span
                className="absolute h-full w-full rounded-full"
                ref={(el) => (videoSpanRef.current[i] = el)}
              />
            </span>
          ))}
        </div>

        {/* Play/Pause/Replay Control Button */}
        <button className="control-btn">
          <img
            src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg}
            alt="control-button"
            onClick={
              isLastVideo
                ? () => handleProcess("video-reset") // Reset to first video
                : !isPlaying
                ? () => handleProcess("play") // Start playing
                : () => handleProcess("pause") // Pause video
            }
          />
        </button>
      </div>
    </>
  );
};

export default VideoCarousel;
