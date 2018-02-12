const twodp = (num) => Math.round(num * 100) / 100

const padNum = (num) => {
  let numTitle = '' + num
  while(numTitle.length < 2) {
    numTitle = '0' + numTitle
  }
  return numTitle
}

const minTitle = (num) => {
  const mins = Math.floor(num / 60)
  const secs = Math.floor(num % 60)
  return padNum(mins) + ':' + padNum(secs)
}

const secTitle = (num) => {
  const msecs = Math.floor((num % 1) * 100)
  return minTitle(num) + ':' + padNum(msecs)
}

const getEventStartTime = (ev) => {
  if(ev.type=='overtake' || ev.type=='spin') {
    return ev.timecode
  }
  else if(ev.type=='lap') {
    return ev.data.start
  }
  return 0
}

const isCloseToTimecode = (videoTime, timecode) => {
  return timecode > (videoTime - 3) && timecode < (videoTime + 3)
}

const isWithinLap = (videoTime, lap) => {
  return videoTime >= lap.data.start && videoTime <= lap.data.end
}

const utils = {
  twodp,
  minTitle,
  secTitle,
  getEventStartTime,
  isCloseToTimecode,
  isWithinLap
}

export default utils