import React from "react";
import Translate from "react-translate-component";
import cnames from "classnames";

export default class Notice extends React.Component {
  render(){
    if (!this.props.notice) {
      return null;
    }

    let notice = this.props.notice;

    let link = notice.link ? <a href={notice.link} target="_blank" style={{float:"right"}}><Translate content="gateway.transwiser.learn_more" /></a> : null

    return <div className="label" style={{fontSize: "1rem", display: "block", marginBottom: "1rem", padding: "1rem"}}>
      {notice.title} {link}
    </div>
  }
}