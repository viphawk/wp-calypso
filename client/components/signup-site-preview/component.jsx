/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { localize, translate } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getLocaleSlug } from 'lib/i18n-utils';
import { getIframeSource } from 'components/signup-site-preview/utils'

/**
 * Style dependencies
 */
import './style.scss';

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

export class SignupSitePreview extends Component {
	static propTypes = {
		// The viewport device to show initially
		defaultViewportDevice: PropTypes.oneOf( [ 'desktop', 'phone' ] ),
		isRtl: PropTypes.bool,
		langSlug: PropTypes.string,
		themeSlug: PropTypes.string,
		siteStyle: PropTypes.string,
		siteType: PropTypes.string,
		// Iframe body content
		content: PropTypes.object,
	};

	static defaultProps = {
		defaultViewportDevice: 'desktop',
		isRtl: false,
		langSlug: 'en',
		siteStyle: 'default',
		siteType: 'business',
		themeSlug: 'pub/professional-business',
		content: {},
	};

	constructor( props ) {
		super( props );
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

		if ( this.props.siteStyle !== nextProps.siteStyle ) {
			return true;
		}

		if ( this.props.content.body !== nextProps.content.body ) {
			this.setIframeContent( '.entry-content', nextProps.content.body );
		}

		return false;
	}

	setIframeContent( selector, content ) {
		if ( ! this.iframe.current ) {
			return;
		}
		const element = this.iframe.current.contentWindow.document.querySelector( selector );

		if ( element ) {
			element.innerHTML = content;
		}
	}

	render() {
		const { font, isDesktop, isPhone, content, isRtl, langSlug, themeSlug } = this.props;
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
						src={ getIframeSource( content, font, isRtl, langSlug, themeSlug ) }
						title={ `${ content.title } – ${ content.tagline }` }
						onLoad={ this.setLoaded }
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
		langSlug: getLocaleSlug(),
	} ),
	null
)( localize( SignupSitePreview ) );


