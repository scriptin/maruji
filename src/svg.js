import _ from 'lodash'

const buildFrame = (width, height) => {
  let w = width - 1
  let h = height - 1
  let rect = '<rect x="0.5" y="0.5" width="' + w +'" height="' + h + '"/>'
  let diag1 = '<path d="M0.5,0.5L' + w + ',' + h + '"/>'
  let diag2 = '<path d="M0.5,' + h + 'L' + w + ',0.5"/>'
  return $('<g class="frame">' + rect + diag1 + diag2 + '</g>')
}

const NAMESPACE = 'kvg:'
export const DATA_PREFIX = 'data-kvg-'

export const preprocess = svg => {
  // remove stroke numbers:
  svg.find('> g:nth-child(2)').remove()
  // remove inline styles from strokes, add a class instead:
  svg.find('> g').removeAttr('style').addClass('strokes')
  // add ordinal numbers to strokes:
  svg.find('path').toArray().forEach((el, idx) => $(el).attr('data-order', idx + 1))
  // to prevent id collision and simplify access to custom attributes, turn them into data-* attributes:
  svg.find('*').toArray().forEach(e => {
    let elem = $(e)
    let attrs = _.fromPairs(_.map(e.attributes, ({ name, value }) => [name, value]))
    _.forEach(attrs, (value, name) => {
      if (name == 'id') {
        elem.removeAttr(name).attr('data-id', value.replace(NAMESPACE, ''))
      } else if (_.startsWith(name, NAMESPACE)) {
        elem.removeAttr(name).attr(DATA_PREFIX + name.replace(NAMESPACE, ''), value)
      }
    })
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
  element  : _.identity,
  variant  : v => new Boolean(v).valueOf(),
  radical  : _.identity,
  original : _.identity,
  position : _.identity,
  partial  : v => new Boolean(v).valueOf(),
  part     : v => new Number(v).valueOf(),
  number   : v => new Number(v).valueOf()
}

const convertAttributes = (attrs, whitelist) => {
  return _(attrs).values()
    .map(({ name, value }) => ({ name: name.replace(DATA_PREFIX, ''), value }))
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
      let subgroups = children.filter(c => c.type == TYPE_GROUP)
      let containsPartialGroups = !!subgroups.find(c => c.attrs.part || c.attrs.number)
      // Small group is a group with just 1 stroke
      let containsSmallGroups = !!subgroups.find(c =>
        c.children.length == 1 && c.children[0].type == TYPE_STROKE
      )
      return {
        type: TYPE_GROUP,
        id: elem.attr('data-id'),
        decomposable: isElement && !containsStrokes && !containsPartialGroups && !containsSmallGroups,
        strokeCount: _.sum(children.map(c => c.strokeCount)),
        attrs,
        children
      }
    case 'path': return {
      type: TYPE_STROKE,
      id: elem.attr('data-id'),
      strokeCount: 1
    }
    default: throw new Error(
      'Unexpected tag "' + type + '" in kanji "' + root.attr(DATA_PREFIX + 'element') + '"'
    )
  }
})

export const getMetadata = svg => getMeta(svg.find('.strokes > g').toArray(), svg)[0]

export const splitIntoComponents = (svg, meta) => {
  if (meta.decomposable) {
    return _.flattenDeep(
      meta.children.map(childMeta => {
        let clone = svg.clone()
        clone.find('[data-id="' + childMeta.id + '"]').siblings().remove()
        return splitIntoComponents(clone, childMeta)
      })
    )
  } else {
    return [svg.clone()]
  }
}
