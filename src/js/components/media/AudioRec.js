export default class audioRec {
  constructor(form, createPostShowAll, postService, url) {
    this.form = form;
    this.createPostShowAll = createPostShowAll;
    this.postService = postService;
    this.url = url;
    this.onAddAudioSubmit = this.onAddAudioSubmit.bind(this);
    this.onStopAudioAndHide = this.onStopAudioAndHide.bind(this);
  }

  bindToDOM() {
    this.audioBtn = this.form.querySelector('.post-audio');
    this.audioPlayer = document.querySelector('.audio');
    this.audioControls = document.querySelector('.audio-controls');
    this.audioSaveBtn = document.querySelector('.audio-save');
    this.audioCancelBtn = document.querySelector('.audio-cancel');

    this.audioBtn.addEventListener('click', this.onAddAudioSubmit);
    this.audioSaveBtn.addEventListener('click', this.onStopAudioAndHide);
    this.audioCancelBtn.addEventListener('click', this.onStopAudioAndHide);
  }

  toggleAudioBlock() {
    this.audioPlayer.classList.toggle('audio_active');
    this.audioControls.classList.toggle('audio-controls_active');
  }

  onStopAudioAndHide(e) {
    if (e.target.className === 'audio-cancel') {
      this.cancelled = true;
    }
    this.recorder.stop();
    this.stream.getTracks().forEach((track) => track.stop());
    this.toggleAudioBlock();
    this.audioBtn.classList.toggle('hidden');
  }

  async onAddAudioSubmit(e) {
    this.audioBtn.classList.toggle('hidden');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    this.stream = stream;
    this.audioPlayer.srcObject = stream;
    this.toggleAudioBlock();
    this.audioPlayer.addEventListener('canplay', this.onCanPlay);
    const recorder = new MediaRecorder(stream);
    this.recorder = recorder;
    const chunks = [];
    recorder.addEventListener('start', () => {
      console.log('start');
      this.cancelled = false;
    });
    recorder.addEventListener('dataavailable', (event) => {
      chunks.push(event.data);
    });
    recorder.addEventListener('stop', async () => {
      if (this.audioIntervalId) {
        clearInterval(this.audioIntervalId);
      }
      // create new post with audio player in it
      if (!this.cancelled) {
        const blob = new Blob(chunks);
        const urlLoc = URL.createObjectURL(blob);
        let url;
        this.uploadAudioForm = document.querySelector('.audio-form');
        this.audioFileInput = document.querySelector('.audio-file-input');
        const fileBlob = new File([blob], 'tmpFile', {
          type: blob.type,
        });
        // create a DataTransfer to get a FileList
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(fileBlob);
        this.audioFileInput.files = dataTransfer.files;
        const data = new FormData(this.uploadAudioForm);
        this.postService.upload(data, (d) => {
          console.log('uploaded');
          url = `${this.url}${d}`; // http://localhost:3000${d};
          this.createPostShowAll(url, 'aud');
        });
      }
    });
    recorder.start();
  }
}
