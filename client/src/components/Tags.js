import { List } from 'immutable'
import React, { Component } from 'react'
import { TagBox } from "react-tag-box"
import { animateScroll } from "react-scroll";

const sampleTags = List(
  ['cute', 'type beat', 'beats', 'hivemind', 'internetboy', 'anime beats', 'tiktok beats'].map(t => ({
    label: t,
    value: t
  }))
)

export default class BackspaceDeletion extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tags: sampleTags,
      selected: sampleTags,
    }
    const tempObj = Object.entries(this.state.selected.toJS());
    const tempArray = [];
    tempObj.forEach(([key, value]) => {
      tempArray.push(value['label'])
    });

    props.setTags(...props.myTags, tempArray)

  }

  componentDidMount() {
      this.scrollToBottom();
  }
  componentDidUpdate() {
      this.scrollToBottom();
  }
  scrollToBottom() {
      animateScroll.scrollToBottom({
        duration: 200,
        delay: 0,
        smooth: 'easeInOutQuint',
        containerId: "tagPills"
      });
  }

  render() {
    const { tags, selected } = this.state
    const onSelect = tag => {
      const newTag = {
        label: tag.label,
        value: tag.value || tag.label
      }

      this.setState({
        selected: selected.push(newTag)
      })

      this.props.setTags([...this.props.myTags, newTag.value])

    }

    const remove = tag => {
      this.setState({
        selected: selected.filter(t => t.value !== tag.value)
      })
      this.props.setTags(this.props.myTags.filter((e)=>(e !== tag.value)))

    }

    const placeholder = selected.isEmpty() ? '' :
      "Tag..."

    return (
      <TagBox
        tags={tags.toJS()}
        selected={selected.toJS()}
        value={this.state.value}
        onSelect={onSelect}
        removeTag={remove}
        backspaceDelete={true}
        placeholder={placeholder}
      />
    )
  }
}
