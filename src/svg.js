const buildFrame = (width, height) => {
  let w = width - 1
  let h = height - 1
  let rect = '<rect x="0.5" y="0.5" width="' + w +'" height="' + h + '"/>'
  let diag1 = '<path d="M0.5,0.5L' + w + ',' + h + '"/>'
  let diag2 = '<path d="M0.5,' + h + 'L' + w + ',0.5"/>'
  return $('<g class="frame">' + rect + diag1 + diag2 + '</g>')
}

export const preprocess = svg => {
  // remove stroke numbers:
  svg.find('> g:nth-child(2)').remove()
  // remove inline styles from strokes, add a class instead:
  svg.find('> g').removeAttr('style').addClass('strokes')
  return svg
}

export const postprocess = (svg, size) => {
  // add frame:
  svg.prepend(buildFrame(svg.attr('width'), svg.attr('height')))
  // set class and adjust attributes of a root element:
  svg.addClass('kanji-svg').attr({ width: size, height: size })
  // remove all ids:
  svg.find('[id]').removeAttr('id')
  return svg
}
