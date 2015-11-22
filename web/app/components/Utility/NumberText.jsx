import React from "react";
import utils from "common/utils";

class NumberText extends React.Component {

    render() {
        let {price, preFormattedPrice, quote, base, component} = this.props;

        let formattedPrice = preFormattedPrice ? preFormattedPrice : utils.price_to_text(price, quote, base);

        return (
            <span>
                <span className="price-integer">{formattedPrice.int}.</span>
                {formattedPrice.dec ? <span className="price-decimal">{formattedPrice.dec}</span> : null}
                {formattedPrice.trailing ? <span className="price-trailing">{formattedPrice.trailing}</span> : null}
            </span>
        )
    }
}

export default NumberText;
