import React, {Component} from "react";
import PropTypes from "prop-types";

import {
    Card,
    CardBody,
    CardTitle,
    Row,
} from "reactstrap";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class LinkCard extends Component {
    
    render(){
        const { title, onClick, button, icon, className } = this.props;
        
        return (
            <Card className={className+" border-0"}>
                <CardBody>
                    <Row>
                        <div className="col">
                            <CardTitle
                                tag="h5"
                                className="text-uppercase text-muted mb-0 text-white cardTitle"
                            >
                                <FontAwesomeIcon className="featureIcon" icon={icon} />
                                <span className="icon_title">{title}</span>
                            </CardTitle>
                        </div>
                    </Row>
                    <p className="mt-3 mb-0 text-sm">
                        <a
                            className="text-nowrap text-white font-weight-600"
                            href="#pablo"
                            onClick={onClick}
                        >
                            {button}
                        </a>
                    </p>
                </CardBody>
            </Card>
        );
    }
}

LinkCard.propTypes = {
    title: PropTypes.string,
    icon: PropTypes.object,
    onClick: PropTypes.func,
    button: PropTypes.string,
    className: PropTypes.string
};

LinkCard.defaultProps = {
    title: 'Link',
    onClick: ( e ) => {console.log('Button clicked');},
    button: "Click Here",
    className: "bg-gradient-default"
}

export default LinkCard;
