/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { localize, translate } from 'i18n-calypso';

/**
 * Style dependencies
 */
import './style.scss';
import {omit} from "lodash";
import {shallowEquals} from "../../reader/utils";

/* TODO @ramonopoly
	// preload Google fonts
	// enable theme switching
	// mobile view
	// extract util functions
*/
function MockupChromeMobile() {
	return (
		<div className="signup-site-preview__chrome-mobile">
			<span className="signup-site-preview__chrome-label">
				{ translate( 'Phone', {
					comment: 'Label for a phone-sized preview of a website',
				} ) }
			</span>
		</div>
	);
}

function MockupChromeDesktop() {
	return (
		<div className="signup-site-preview__chrome-desktop">
			<svg width="38" height="10">
				<g>
					<rect width="10" height="10" rx="5" />
					<rect x="14" width="10" height="10" rx="5" />
					<rect x="28" width="10" height="10" rx="5" />
				</g>
			</svg>
			<span className="signup-site-preview__chrome-label">{ translate( 'Website Preview' ) }</span>
		</div>
	);
}

function getIframeCssUri( themeSlug, isRtl ) {
	return `https://s0.wp.com/wp-content/themes/${ themeSlug }/style${ isRtl ? '-rtl' : '' }.css`;
}

function getIframeSource( content, isRtl, langSlug, themeSlug ) {
	const source = `
		<html lang="${ langSlug }" dir="${ isRtl ? 'rtl' : 'ltr' }">
		<head>
			<title>${ content.title } – ${ content.tagline }</title>
			<link type="text/css" media="all" rel="stylesheet" href="https://s0.wp.com/wp-content/plugins/gutenberg-core/build/block-library/style.css" />
			<link type="text/css" media="all" rel="stylesheet" href="${ getIframeCssUri( themeSlug, isRtl ) }" />
			<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Crimson+Text%3A400%2C600%2C700%2C400italic%2C600italic&#038;subset=latin%2Clatin-ext" type="text/css" media="all" />
		</head>
		<body class="home page-template-default page logged-in">
			<div id="page" class="site">
				<header id="masthead" class="site-header">
					<div class="site-branding-container">
						<div class="site-branding">
							<p class="site-title"><a href="#" rel="home">${ content.title }</a></p>
							<p class="site-description"><a href="#" rel="home">${ content.tagline }</a></p>
							<nav id="site-navigation" class="main-navigation" aria-label="Top Menu"></nav>
						</div>
					</div>
				</header>
				<div id="content" class="site-content">
					<section id="primary" class="content-area">
						<main id="main" class="site-main">
							<article class="page type-page status-publish hentry entry">
								<div class="entry-content">${ content.body }</div>
							</article>
						</main>
					</section>
				</div>
			</div>
		</body>
	</html>`;

	return URL.createObjectURL( new Blob( [ source ], { type: 'text/html' } ) )
}

export class SignupSitePreview extends Component {
	static propTypes = {
		// The viewport device to show initially
		defaultViewportDevice: PropTypes.oneOf( [ 'desktop', 'phone' ] ),
		// External CSS to load
		cssUrl: PropTypes.string.isRequired,
		isRtl: PropTypes.bool,
		langSlug: PropTypes.string,
		themeSlug: PropTypes.string,
		// Iframe body content
		content: PropTypes.object,
	};

	static defaultProps = {
		defaultViewportDevice: 'desktop',
		isRtl: false,
		langSlug: 'en',
		themeSlug: 'pub/professional-business',
	};

	constructor(props) {
		super(props);
		this.iframe = React.createRef();
		this.state = {
			loaded: false,
		};
	}

	shouldComponentUpdate( nextProps ) {
		if ( this.props.content.title !== nextProps.content.title ) {
			this.setIframeContent( '.site-title > a', nextProps.content.title );
		}

		if ( this.props.content.tagline !== nextProps.content.tagline ) {
			this.setIframeContent( '.site-description > a', nextProps.content.tagline );
		}

		if ( this.props.themeSlug !== nextProps.themeSlug ) {
			return true;
		}

		return false;
	}



/*	componentDidUpdate( prevProps ) {
		this.setIframeCss();
		this.setIframeContent( getIframeContent( this.props.content ) );
	}

	setIframeContent( content ) {
		if ( ! this.iframe ) {
			return;
		}
		this.iframe.contentDocument.open();
		this.iframe.contentDocument.write( content );
		this.iframe.contentDocument.close();
	}

	setIframeCss() {
		if ( ! this.iframe ) {
			return;
		}
		const cssLink = document.createElement( 'link' );
		cssLink.href = 'https://s0.wp.com/wp-content/themes/pub/professional-business/style.css';
		cssLink.rel = 'stylesheet';
		cssLink.type = 'text/css';
		this.iframe.document.head.appendChild( cssLink );
	}*/

	setIframeContent( selector, content ) {
		if ( ! this.iframe.current ) {
			return;
		}
		const element = this.iframe.current.contentWindow.document.querySelector( selector );
		if ( element ) {
			element.innerHTML = content;
		}
	}

	setLoaded = () => {
		this.setState( { loaded: true } );
	};

	render() {
		const { isDesktop, isPhone, content, isRtl, langSlug, themeSlug } = this.props;
		const className = classNames( this.props.className, 'signup-site-preview__wrapper', {
			'is-desktop': isDesktop,
			'is-phone': isPhone,
		} );

		return (
			<div className={ className }>
				<div className="signup-site-preview__iframe-wrapper">
					{ isPhone ? <MockupChromeMobile /> : <MockupChromeDesktop /> }
					<iframe
						ref={ this.iframe }
						className="signup-site-preview__iframe"
						src={ getIframeSource( content, isRtl, langSlug, themeSlug ) }
						title={ `${ content.title } – ${ content.tagline }` }
					/>
				</div>
			</div>
		);
	}
}

export default connect(
	( state, ownProps ) => ( {
		isDesktop: 'desktop' === ownProps.defaultViewportDevice,
		isPhone: 'phone' === ownProps.defaultViewportDevice,
	} ),
	null
)( localize( SignupSitePreview ) );
