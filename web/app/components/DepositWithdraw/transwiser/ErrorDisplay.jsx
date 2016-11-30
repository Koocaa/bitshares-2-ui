import React from "react";
import Translate from "react-translate-component";
import cnames from "classnames";

export default class ErrorDisplay extends React.Component {
  render(){
    return <div style={{textAlign: 'center'}}>
      <h3>{this.props.message}</h3>
      {
        !this.props.reload ?
        null :
        <div onClick={this.props.onReloadClicked} className="button active"><Translate content="gateway.transwiser.reload" /></div>
      }
    </div>
  }
}