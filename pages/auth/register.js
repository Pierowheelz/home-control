/*!

=========================================================
* Login page handler
=========================================================
*/
import React, {Component} from "react";
import Link from "next/link";
import { withRouter } from 'next/router';
// nodejs library to set properties for components
import PropTypes from "prop-types";
// nodejs library that concatenates classes
import classnames from "classnames";
// reactstrap components
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    FormGroup,
    Form,
    Input,
    FormFeedback,
    InputGroupAddon,
    InputGroupText,
    InputGroup,
    Container,
    Row,
    Col,
    Spinner,
} from "reactstrap";
// layout for this page
import Auth from "layouts/Auth.js";
// core components
import AuthHeader from "components/Headers/AuthHeader.js";
//classes
import WbSession from "classes/Session.jsx";
//Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAt, faKey, faUser } from '@fortawesome/pro-light-svg-icons'

class Register extends Component {
    static contextType = WbSession;
    state = {
        fname: '',
        lname: '',
        user: '',
        pass: '',
        error: false,
        errorMsg: '',
        errorFld: '',
        loading: false, //handle animation for this
        registered: false, //handle route redirect to main page when true
        focusedFName: false,
        focusedLName: false,
        focusedEmail: false,
        focusedPassword: false
    };
    
    handleChange = (inputName, newValue) => {
        var newState = {error: false};
        newState[inputName] = newValue;
        this.setState(newState);
    };
    handleSubmit = async (event) => {
        event.preventDefault();
        
        let error = false;
        let errorMsg = '';
        let errorFld = '';
        let input = this.state;
        if( '' === input.fname ){
            error = true;
            errorMsg = 'Please enter your First Name';
            errorFld = 'fname';
        }
        if( '' === input.lname ){
            error = true;
            errorMsg = 'Please enter your Last Name';
            errorFld = 'lname';
        }
        if( '' === input.user ){
            error = true;
            errorMsg = 'Please enter your username (or email address)';
            errorFld = 'user';
        }
        if( !error && '' === input.pass ){
            error = true;
            errorMsg = 'Please enter your password';
            errorFld = 'pass';
        }
        
        // validate then send to server
        if( !error ){
            //send to server
            this.tryRegister();
            this.setState({loading:true});
        } else {
            this.setState({error,errorMsg,errorFld,pass:''});
        }
    };
    handleRedirects = () => {
        if (this.state.registered) {
            this.props.router.push({pathname: '/auth/login'});
            return <>Redirecting...</>
        }
    };
    tryRegister = async () => {
        let input = this.state;
        console.log('Attempting registration: ', input);
        let session = null;
        try{
            session = await this.context.register( input.fname, input.lname, input.user, input.pass );
            console.log('Registration info: ', session);
        } catch(err) {
            console.warn(err);
            session = {
                code: 'server_error'
            };
        }
        
        
        //check results, set loading to false, display errors or set registered to true
        if( session.success ){
            this.setState({loading:false, registered:true});
        } else {
            let errorMsg = '';
            let errorFld = '';
            if( session.code && session.code.includes('incorrect_password') ){
                errorFld = 'pass';
                errorMsg = 'Incorrect password';
            } else if( session.code && session.code.includes('invalid_username') ){
                errorFld = 'user';
                errorMsg = 'Invalid username';
            } else if( session.code && session.code.includes('invalid_email') ){
                errorFld = 'user';
                errorMsg = 'Invalid username';
            } else if( session.code && session.code.includes('server_error') ){
                errorMsg = 'Error connecting to server';
            } else if( session.code && session.message ){
                errorMsg = session.message;
            }
            //handle error messages
            this.setState({loading:false, error:true, errorMsg, errorFld});
        }
    };
    
    getError = (input) => {
        let error = false;
        if( this.state.error && (input === this.state.errorFld || '' === this.state.errorFld) ){
            error = true;
        }
        
        return error;
    };
    getSubtitle = (input) => {
        let desc = '';
        if( this.state.error && (input === this.state.errorFld || (input==='pass' && '' === this.state.errorFld) ) ){
            desc = 'Invalid username or password';
            if( '' !== this.state.errorMsg ){
                desc = this.state.errorMsg;
            }
        }
        
        return desc;
    };
    
    setfocusedFName = ( newState ) => {
        this.setState({ focusedFName: newState });
    };
    setfocusedLName = ( newState ) => {
        this.setState({ focusedLName: newState });
    };
    setfocusedEmail = ( newState ) => {
        this.setState({ focusedEmail: newState });
    };
    setfocusedPassword = ( newState ) => {
        this.setState({ focusedPassword: newState });
    };
    
    render() {
        const { focusedFName, focusedLName, focusedEmail, focusedPassword } = this.state;
        
        return (
            <>
            <AuthHeader
				title="Please Log In"
				lead="Enter your username and password to continue."
			/>
			<Container className="mt--8 pb-5">
				<Row className="justify-content-center">
					<Col lg="5" md="7">
						<Card className="bg-secondary border-0 mb-0">
							<CardBody className="px-lg-5 py-lg-5">
								<form role="form" onSubmit={this.handleSubmit}>
									{this.handleRedirects()}
                                    <FormGroup
										className={classnames("mb-3", {
											focused: focusedFName,
										})}
									>
										<InputGroup className="input-group-merge input-group-alternative">
											<InputGroupAddon addonType="prepend">
												<InputGroupText>
													<FontAwesomeIcon icon={faUser} />
												</InputGroupText>
											</InputGroupAddon>
											<Input
												label="First Name"
												id="fname"
												type="text"
                                                placeholder="Enter first name"
                                                invalid={this.getError('fname')}
												onFocus={() => this.setfocusedFName(true)}
												onBlur={() => this.setfocusedFName(true)}
												value={this.state.fname}
												onChange={(event) => this.handleChange(event.target.id, event.target.value)}
												autoComplete='first_name'
												autoCorrect='off'
												autoCapitalize='on'
												spellCheck='false'
												readOnly={this.state.loading}
											/>
                                            <FormFeedback className="fld_error">{this.getSubtitle('fname')}</FormFeedback>
										</InputGroup>
									</FormGroup>
                                    <FormGroup
										className={classnames("mb-3", {
											focused: focusedLName,
										})}
									>
                                        <InputGroup className="input-group-merge input-group-alternative">
                                            <InputGroupAddon addonType="prepend">
                                                <InputGroupText>
                                                    <FontAwesomeIcon icon={faUser} />
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <Input
                                                label="Last Name"
                                                id="lname"
                                                type="text"
                                                placeholder="Enter last name"
                                                invalid={this.getError('lname')}
                                                onFocus={() => this.setfocusedLName(true)}
                                                onBlur={() => this.setfocusedLName(true)}
                                                value={this.state.lname}
                                                onChange={(event) => this.handleChange(event.target.id, event.target.value)}
                                                autoComplete='last_name'
                                                autoCorrect='off'
                                                autoCapitalize='on'
                                                spellCheck='false'
                                                readOnly={this.state.loading}
                                            />
                                            <FormFeedback className="fld_error">{this.getSubtitle('lname')}</FormFeedback>
                                        </InputGroup>
									</FormGroup>
									<FormGroup
										className={classnames("mb-3", {
											focused: focusedEmail,
										})}
									>
										<InputGroup className="input-group-merge input-group-alternative">
											<InputGroupAddon addonType="prepend">
												<InputGroupText>
													<FontAwesomeIcon icon={faAt} />
												</InputGroupText>
											</InputGroupAddon>
											<Input
												label="Username"
												id="user"
												type="email"
                                                placeholder="Enter email address"
                                                invalid={this.getError('user')}
												onFocus={() => this.setfocusedEmail(true)}
												onBlur={() => this.setfocusedEmail(true)}
												value={this.state.user}
												onChange={(event) => this.handleChange(event.target.id, event.target.value)}
												autoComplete='username'
												autoCorrect='off'
												autoCapitalize='off'
												spellCheck='false'
												readOnly={this.state.loading}
											/>
                                            <FormFeedback className="fld_error">{this.getSubtitle('user')}</FormFeedback>
										</InputGroup>
									</FormGroup>
									<FormGroup
										className={classnames({
											focused: focusedPassword,
										})}
									>
										<InputGroup className="input-group-merge input-group-alternative">
											<InputGroupAddon addonType="prepend">
												<InputGroupText>
													<FontAwesomeIcon icon={faKey} />
												</InputGroupText>
											</InputGroupAddon>
											<Input
												label="Password"
												id="pass"
												type="password"
                                                placeholder="Enter password"
                                                invalid={this.getError('pass')}
												onFocus={() => this.setfocusedPassword(true)}
												onBlur={() => this.setfocusedPassword(true)}
												value={this.state.pass}
												onChange={(event) => this.handleChange(event.target.id, event.target.value)}
												autoComplete='current-password'
												autoCorrect='off'
												autoCapitalize='off'
												spellCheck='false'
												readOnly={this.state.loading}
											/>
                                            <FormFeedback className="fld_error">{this.getSubtitle('pass')}</FormFeedback>
										</InputGroup>
									</FormGroup>
									<div className="formsubmit_wrapper">
										<Button
											className="formsubmit"
											color="primary"
											type="submit"
										>Register</Button>
										{this.state.loading && <Spinner color="primary" />}
									</div>
								</form>
							</CardBody>
							<CardFooter>
								<Row className="justify-content-center">
									<Col lg="6" md="6">
										<Link
											href="/auth/login"
										>Login</Link>
									</Col>
								</Row>
							</CardFooter>
						</Card>
					</Col>
				</Row>
			</Container>
            </>
        );
    }
}

const RegisterExport = withRouter(Register);
RegisterExport.layout = Auth;

export default RegisterExport;
