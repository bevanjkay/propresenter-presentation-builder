export const Fields = {
  presentation: {
    documentInfo: 1,
    uuid: 2,
    title: 3,
    scale: 8,
    options: 9,
    cueOrder: 12,
    cue: 13,
    notes: 14,
    size: 17
  },
  cue: {
    id: 1,
    active: 5,
    notes: 8,
    body: 10,
    enabled: 12
  },
  cueBody: {
    id: 1,
    label: 3,
    enabled: 6,
    mediaType: 9,
    slide: 23
  },
  textElement: {
    id: 1,
    name: 2,
    frame: 3,
    opacity: 5,
    fill: 8,
    border: 9,
    shadow: 10,
    transform: 11,
    cornerRadius: 12,
    text: 13,
    notes: 14
  }
} as const;
