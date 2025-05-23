// eslint-disable-next-line import/no-cycle
import { createElement, getTextLabel, isExternalVideoAllowed } from './common.js';

/* video helpers */
export function isLowResolutionVideoUrl(url) {
  return (typeof url === 'string') && url.split('?')[0].endsWith('.mp4');
}

export function isVideoLink(link) {
  const linkString = link.getAttribute('href');
  return (linkString.includes('youtube.com/embed/') || isLowResolutionVideoUrl(linkString)) && link.closest('.block.embed') === null;
}

export function selectVideoLink(links, preferredType) {
  const linksList = [...links];
  const shouldUseYouTubeLinks = isExternalVideoAllowed() && preferredType !== 'local';
  const youTubeLink = linksList.find((link) => link.getAttribute('href').includes('youtube.com/embed/'));
  const localMediaLink = linksList.find((link) => link.getAttribute('href').split('?')[0].endsWith('.mp4'));

  if (preferredType === 'singleVideo' && youTubeLink) {
    return youTubeLink;
  }
  if (shouldUseYouTubeLinks && youTubeLink) {
    return youTubeLink;
  }
  return localMediaLink;
}

export function createLowResolutionBanner() {
  const lowResolutionMessage = getTextLabel('Low resolution video message');
  const changeCookieSettings = getTextLabel('Change cookie settings');
  let banner;

  if (document.documentElement.classList.contains('redesign-v2')) {
    banner = createElement('div', { classes: 'low-resolution-banner' });
    const bannerText = createElement('p');
    const bannerButton = createElement('button', { classes: ['button', 'secondary', 'dark'] });

    bannerText.textContent = lowResolutionMessage;
    bannerButton.textContent = changeCookieSettings;

    banner.appendChild(bannerText);
    banner.appendChild(bannerButton);

    bannerButton.addEventListener('click', () => {
      window.OneTrust.ToggleInfoDisplay();
    });
  } else {
    banner = document.createElement('div');
    banner.classList.add('low-resolution-banner');
    banner.innerHTML = `${lowResolutionMessage} <button class="low-resolution-banner-cookie-settings">${changeCookieSettings}</button>`;
    banner.querySelector('button').addEventListener('click', () => {
      window.OneTrust.ToggleInfoDisplay();
    });
  }

  return banner;
}

export function showVideoModal(linkUrl) {
  // eslint-disable-next-line import/no-cycle
  import('../common/modal/modal.js').then((modal) => {
    let beforeBanner = null;

    if (isLowResolutionVideoUrl(linkUrl)) {
      beforeBanner = createLowResolutionBanner();
    }

    modal.showModal(linkUrl, { beforeBanner });
  });
}

export function addVideoShowHandler(link) {
  link.classList.add('text-link-with-video');

  link.addEventListener('click', (event) => {
    event.preventDefault();

    showVideoModal(link.getAttribute('href'));
  });
}

export function isSoundcloudLink(link) {
  return link.getAttribute('href').includes('soundcloud.com/player') && link.closest('.block.embed') === null;
}

export function addSoundcloudShowHandler(link) {
  link.classList.add('text-link-with-soundcloud');

  link.addEventListener('click', (event) => {
    event.preventDefault();

    const thumbnail = link.closest('div')?.querySelector('picture');
    const title = link.closest('div')?.querySelector('h1, h2, h3');
    const text = link.closest('div')?.querySelector('p:not(.button-container, .image)');

    // eslint-disable-next-line import/no-cycle
    import('../common/modal/modal.js').then((modal) => {
      const episodeInfo = document.createElement('div');
      episodeInfo.classList.add('modal-soundcloud');
      episodeInfo.innerHTML = `<div class="episode-image"><picture></div>
      <div class="episode-text">
          <h2></h2>
          <p></p>
      </div>`;
      episodeInfo.querySelector('picture').innerHTML = thumbnail?.innerHTML || '';
      episodeInfo.querySelector('h2').innerText = title?.innerText || '';
      episodeInfo.querySelector('p').innerText = text?.innerText || '';

      modal.showModal(link.getAttribute('href'), { beforeIframe: episodeInfo });
    });
  });
}

export function addPlayIcon(parent) {
  const playButton = document.createRange().createContextualFragment(`
    <span class="icon icon-play-video">
      <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="36" cy="36" r="30" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M49.3312 35.9998L29.3312 24.4528L29.3312 47.5468L49.3312 35.9998ZM44.3312 35.9998L31.8312 28.7829L31.8312 43.2167L44.3312 35.9998Z" fill="#141414"/>
      </svg>
    </span>`);

  parent.appendChild(playButton);
}

export function wrapImageWithVideoLink(videoLink, image) {
  videoLink.innerText = '';
  videoLink.appendChild(image);
  videoLink.classList.add('link-with-video');
  videoLink.classList.remove('button', 'primary', 'text-link-with-video');
  addPlayIcon(videoLink);
}

export function createIframe(url, { parentEl, classes = [] }) {
  // iframe must be recreated every time otherwise the new history record would be created
  const iframe = createElement('iframe', {
    classes: Array.isArray(classes) ? classes : [classes],
    props: {
      frameborder: '0', allowfullscreen: 'allowfullscreen', src: url,
    },
  });

  if (parentEl) {
    parentEl.appendChild(iframe);
  }

  return iframe;
}

export function setPlaybackControls() {
  const playbackControls = document.querySelectorAll('video > button');
  playbackControls.forEach((control) => {
    const { parentElement } = control.parentElement;
    parentElement.append(control);
  });
}

export const createVideo = (src, className = '', props = {}) => {
  const video = createElement('video', {
    classes: className,
  });
  if (props.muted) {
    video.muted = props.muted;
  }

  if (props.autoplay) {
    video.autoplay = props.autoplay;
  }

  if (props) {
    Object.keys(props).forEach((propName) => {
      video.setAttribute(propName, props[propName]);
    });
  }

  const source = createElement('source', {
    props: {
      src, type: 'video/mp4',
    },
  });

  // Playback controls - play and pause button
  const playPauseButton = createElement('button', {
    props: { type: 'button', class: 'v2-video__playback-button' },
  });

  const videoControls = document.createRange().createContextualFragment(`
    <span class="icon icon-pause-video">
       <svg width="27" height="27" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="36" cy="36" r="30" fill="white"/>
          <rect x="28.25" y="24.45" width="2.75" height="23.09" fill="#141414"/>
          <rect x="41" y="24.45" width="2.75" height="23.09" fill="#141414"/>
       </svg>
    </span>
    <span class="icon icon-play-video">
      <svg width="27" height="27" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="36" cy="36" r="30" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M49.3312 35.9998L29.3312 24.4528L29.3312 47.5468L49.3312 35.9998ZM44.3312 35.9998L31.8312 28.7829L31.8312 43.2167L44.3312 35.9998Z" fill="#141414"/>
      </svg>
    </span>`);

  playPauseButton.append(...videoControls.children);
  video.appendChild(playPauseButton);

  const playIcon = video.querySelector('.icon-play-video');
  const pauseIcon = video.querySelector('.icon-pause-video');

  const pauseVideoLabel = getTextLabel('Pause video');
  const playVideoLabel = getTextLabel('Play video');

  playPauseButton.setAttribute('aria-label', pauseVideoLabel);

  const togglePlayPauseIcon = (isPaused) => {
    if (isPaused) {
      pauseIcon.style.display = 'none';
      playIcon.style.display = 'flex';
      playPauseButton.setAttribute('aria-label', playVideoLabel);
    } else {
      pauseIcon.style.display = 'flex';
      playIcon.style.display = 'none';
      playPauseButton.setAttribute('aria-label', pauseVideoLabel);
    }
  };
  togglePlayPauseIcon(video.paused);

  const togglePlayPause = (el) => {
    el[video.paused ? 'play' : 'pause']();
  };

  playPauseButton.addEventListener('click', () => {
    togglePlayPause(video);
  });
  video.addEventListener('playing', () => {
    togglePlayPauseIcon(video.paused);
  });
  video.addEventListener('pause', () => {
    togglePlayPauseIcon(video.paused);
  });

  // If the video is not playing, we’ll try to play again
  if (props.autoplay) {
    video.addEventListener('loadedmetadata', () => {
      setTimeout(() => {
        if (video.paused) {
          // eslint-disable-next-line no-console
          console.warn('Failed to autoplay video, fallback code executed');
          video.play();
        }
      }, 500);
    }, { once: true });
  }

  setPlaybackControls();
  video.appendChild(source);

  return video;
};

export function getDynamicVideoHeight(video, playbackControls) {
  // Get the element's height(use requestAnimationFrame to get actual height instead of 0)
  requestAnimationFrame(() => {
    const height = video.offsetHeight - 60;
    playbackControls.style.top = `${height.toString()}px`;
  });

  // Get the element's height on resize
  const getVideoHeight = (entries) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const entry of entries) {
      const height = entry.target.offsetHeight - 60;
      playbackControls.style.top = `${height.toString()}px`;
    }
  };

  const resizeObserver = new ResizeObserver(getVideoHeight);
  resizeObserver.observe(video);
}

/**
 * Creates a video element with a poster image.
 * @param {HTMLElement} linkEl - The link element that contains the video URL.
 * @param {HTMLPictureElement} poster - The URL of the poster image.
 * @param {string} blockName - The name of the CSS block for styling.
 * @return {HTMLElement} - The container element that holds the video and poster.
 */
export function createVideoWithPoster(linkEl, poster, blockName) {
  const linkUrl = linkEl.getAttribute('href');
  const videoContainer = document.createElement('div');
  videoContainer.classList.add(`${blockName}__video-container`, `${blockName}--video-with-poster`);

  let videoOrIframe;
  let playButton;

  const showVideo = (e) => {
    const ele = e.currentTarget;
    const eleParent = ele.parentElement;
    const picture = eleParent?.querySelector('picture');
    const video = eleParent?.querySelector('video');
    const iframe = eleParent?.querySelector('iframe');
    if (eleParent && picture) {
      ele.remove();
      picture.remove();
      if (video) video.style.display = 'block';
      if (iframe) iframe.style.display = 'block';
    }
  };

  if (isLowResolutionVideoUrl(linkUrl)) {
    videoOrIframe = createVideo(linkUrl, `${blockName}__video`, {
      muted: false, autoplay: false, loop: true, playsinline: true, controls: true,
    });
  } else {
    videoOrIframe = createIframe(linkUrl, { classes: `${blockName}__iframe` });
    playButton = createElement('button', {
      props: { type: 'button', class: 'v2-video__playback-button' },
    });
    addPlayIcon(playButton);
    videoContainer.append(playButton);
  }
  videoContainer.append(poster, videoOrIframe);
  videoContainer.querySelector('.v2-video__playback-button').addEventListener('click', showVideo);
  videoContainer.querySelector('.icon-pause-video')?.remove();
  return videoContainer;
}

const getMuteSvg = () => `<svg width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16.335" cy="16.335" r="13.335" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd"
          d="M9.887 10.181a.5.5 0 0 0-.707.708l12.934 12.928a.5.5 0 0 0 .706-.707L9.887 10.182Zm6.05 1.997a.5.5 0 0 0-.851-.357l-.56.553-.309.306-.099.098-.027.027-.007.007-.002.002.348.353-.348-.353a.5.5 0 1 0 .703.711l-.35-.353.35.353.002-.002.007-.008.028-.027.098-.097.016-.016v.738a.5.5 0 1 0 1 0v-1.935Zm-4.358 3.239h-.992v3.332h1.54c.238 0 .483.064.693.152.211.09.426.218.594.382l.002.002-.351.356.351-.355h.002l.004.005.017.017.064.063.231.229.728.719.474.47v-2.071a.5.5 0 1 1 1 0v3.27a.5.5 0 0 1-.853.354c-.186-.186-.777-.771-1.324-1.312l-.728-.719-.23-.229-.065-.063-.017-.016-.003-.003a.953.953 0 0 0-.284-.177.855.855 0 0 0-.305-.074h-1.936a.614.614 0 0 1-.604-.61v-4.112c0-.319.254-.61.604-.61h1.388a.5.5 0 0 1 0 1Zm8.418-2.332a.5.5 0 1 0-.42.908 3.406 3.406 0 0 1 1.983 3.088c0 .873-.33 1.666-.872 2.268a.5.5 0 1 0 .743.67 4.374 4.374 0 0 0 1.13-2.938c0-1.78-1.06-3.3-2.564-3.996Zm-1.787 2.23a.5.5 0 0 1 .662-.249 2.209 2.209 0 0 1 1.299 2.018 2.2 2.2 0 0 1-.342 1.183.5.5 0 1 1-.845-.535 1.2 1.2 0 0 0 .186-.648c0-.496-.29-.916-.711-1.107a.5.5 0 0 1-.249-.662Z"
          fill="#141414"/>
</svg>`;

const getUnmuteSvg = () => `<svg width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16.335" cy="16.335" r="13.335" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M16.284 11.633a.5.5 0 0 1 .306.46v9.811a.5.5 0 0 1-.853.354c-.186-.186-.777-.771-1.324-1.312l-.727-.719-.232-.229-.064-.063-.017-.016-.003-.003a.957.957 0 0 0-.284-.177.855.855 0 0 0-.305-.074H10.84a.613.613 0 0 1-.604-.61v-4.112c0-.064.012-.126.034-.182a.604.604 0 0 1 .576-.428h1.936c.07 0 .18-.022.305-.075a.956.956 0 0 0 .283-.174l.004-.004.017-.017.064-.063.231-.23.728-.72 1.327-1.313a.5.5 0 0 1 .544-.104Zm-2.565 2.808.352.355-.003.003a1.94 1.94 0 0 1-.594.381c-.21.089-.455.153-.693.153h-1.546v3.332h1.546c.238 0 .483.064.693.152.211.09.426.218.594.382l.002.002-.351.356.351-.355.002.001.004.004.017.017.064.063.231.229.728.719.474.47V13.29l-.474.47-.727.72-.231.23-.064.063-.017.016-.005.004v.002h-.001l-.352-.355Zm4.82-1.198a.5.5 0 0 1 .663-.244 4.406 4.406 0 0 1 2.563 3.996c0 1.78-1.06 3.299-2.563 3.995a.5.5 0 1 1-.42-.907 3.406 3.406 0 0 0 1.983-3.088c0-1.37-.815-2.547-1.983-3.088a.5.5 0 0 1-.244-.664Zm-.456 1.735a.5.5 0 1 0-.413.911 1.215 1.215 0 0 1-.004 2.216.5.5 0 1 0 .421.907 2.215 2.215 0 0 0 1.295-2.016c0-.901-.532-1.67-1.299-2.018Z"
              fill="#141414"/>
    </svg>`;

/**
 * Adds mute controls to a given section.
 * @param {HTMLElement} section - The section element to add the controls to.
 * @returns {void}
 */
export const addMuteControls = (section) => {
  const muteSvg = getMuteSvg();
  const unmuteSvg = getUnmuteSvg();

  const controls = createElement('button', {
    props: { type: 'button', class: 'v2-video__mute-controls' },
  });

  const iconsHTML = document.createRange().createContextualFragment(`
    <span class="icon icon-mute">${muteSvg}</span>
    <span class="icon icon-unmute">${unmuteSvg}</span>
  `);

  controls.append(...iconsHTML.children);
  section.appendChild(controls);

  const video = section.querySelector('video');
  const muteIcon = section.querySelector('.icon-mute');
  const unmuteIcon = section.querySelector('.icon-unmute');
  const muteIconLabel = getTextLabel('Mute video');
  const unmuteIconLabel = getTextLabel('Unmute video');

  controls.setAttribute('aria-label', unmuteIconLabel);

  if (!video) return;

  const showHideMuteIcon = (isMuted) => {
    if (isMuted) {
      muteIcon.style.display = 'flex';
      unmuteIcon.style.display = 'none';
      controls.setAttribute('aria-label', muteIconLabel);
    } else {
      muteIcon.style.display = 'none';
      unmuteIcon.style.display = 'flex';
      controls.setAttribute('aria-label', unmuteIconLabel);
    }
  };

  const toggleMute = (el) => {
    el.muted = !el.muted;
  };

  controls.addEventListener('click', () => {
    toggleMute(video);
  });
  video.addEventListener('volumechange', () => {
    showHideMuteIcon(video.muted);
  });
};

export function loadYouTubeIframeAPI() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
