import _ from 'lodash'

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
  // add ordinal numbers to strokes:
  svg.find('path').toArray().forEach((el, idx) => $(el).attr('data-order', idx + 1))
  // move values of id attributes to data-id to prevent id collisions:
  svg.find('[id]').toArray().forEach(e => {
    let elem = $(e)
    let id = elem.attr('id')
    elem.removeAttr('id').attr('data-id', id.replace('kvg:', ''))
  })
  return svg
}

export const postprocess = (svg, size) => {
  // add frame:
  svg.prepend(buildFrame(svg.attr('width'), svg.attr('height')))
  // set class and adjust attributes of a root element:
  svg.addClass('kanji-svg').attr({ width: size, height: size })
  return svg
}

export const splitIntoStrokes = svg => {
  return svg.find('.strokes path').toArray().map((stroke, idx) => {
    let clone = svg.clone()
    let order = $(stroke).attr('data-order')
    let highlightedStroke = clone.find('.strokes path[data-order=' + order + ']')
    let path = highlightedStroke.attr('d')
    let start = path.split(/[a-z]+/i)
      .filter(part => ! _.isEmpty(part))[0]
      .split(',')
      .map(v => new Number(_.trim(v)).valueOf())

    clone.append(
      $('<circle/>')
        .addClass('stroke-start')
        .attr({ cx: start[0], cy: start[1], r: 6 })
    )
    highlightedStroke.addClass('highlighted')
    clone.find('.strokes path[data-order!=' + order + ']').addClass('muted')

    return clone
  })
}

export const muteAllStrokes = svg => {
  svg.find('.strokes path').addClass('muted')
  return svg
}

const GROUP_ATTRS = {
  element: _.identity,
  variant: v => new Boolean(v).valueOf(),
  radical: _.identity,
  original: _.identity,
  position: _.identity,
  partial: v => new Boolean(v).valueOf(),
  part: v => new Number(v).valueOf(),
  number: v => new Number(v).valueOf()
}

const convertAttributes = (attrs, whitelist) => {
  return _(attrs).values()
    .map(({ name, value }) => ({ name: name.replace('kvg:', ''), value }))
    .filter(({ name, value }) => _.includes(_.keys(whitelist), name))
    .map(({ name, value }) => [name, whitelist[name](value)])
    .fromPairs()
    .value()
}

const TYPE_GROUP = 'group'
const TYPE_STROKE = 'stroke'

// root is passed only for error messages
const getMeta = (elems, root) => elems.map(el => {
  let elem = $(el)
  let type = elem.prop('tagName')
  switch (type) {
    case 'g':
      let attrs = convertAttributes(el.attributes, GROUP_ATTRS)
      let children = getMeta(elem.children().toArray(), root)
      let isElement = _.has(attrs, 'element')
      let containsStrokes = children.find(c => c.type == TYPE_STROKE) != null
      let containsPartialGroups = children.find(c =>
        c.type == TYPE_GROUP && (c.attrs.partial || c.attrs.part || c.attrs.number)
      ) != null
      return {
        type: TYPE_GROUP,
        id: elem.attr('id'),
        decomposable: isElement && !containsStrokes && !containsPartialGroups,
        strokeCount: _.sum(children.map(c => c.strokeCount)),
        attrs,
        children
      }
    case 'path': return {
      type: TYPE_STROKE,
      id: elem.attr('id'),
      strokeCount: 1
    }
    default: throw new Error(
      'Unexpected tag "' + type + '" in kanji "' + root.attr('kvg\\:element') + '"'
    )
  }
})

export const getMetadata = svg => getMeta(svg.find('.strokes > g').toArray(), svg)[0]
