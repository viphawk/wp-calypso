/** @format */

/**
 * External dependencies
 */
import debugModule from 'debug';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { debounce, find, get, noop, startsWith, throttle, trim, uniq, isEmpty } from 'lodash';
import { localize } from 'i18n-calypso';
import request from 'superagent';

/**
 * Internal dependencies
 */
import SuggestionSearch from 'components/suggestion-search';
import { convertToCamelCase } from 'state/data-layer/utils';

const debug = debugModule( 'calypso:signup:vertical-search' );

export class SiteVerticalsSuggestionSearch extends Component {
	static propTypes = {
		charsToTriggerSearch: PropTypes.number,
		initialValue: PropTypes.string,
		lastUpdated: PropTypes.number,
		onChange: PropTypes.func,
		requestVerticals: PropTypes.func,
		placeholder: PropTypes.string,
		searchResultsLimit: PropTypes.number,
	};

	static defaultProps = {
		charsToTriggerSearch: 1,
		initialValue: '',
		onChange: noop,
		requestVerticals: noop,
		placeholder: '',
		searchResultsLimit: 5,
	};

	isSearchPending = false;

	constructor( props ) {
		super( props );
		this.request = null;
		this.state = {
			searchValue: props.initialValue,
			results: [],
			defaultVertical: [],
		};
		this.props.requestVerticals( 'business', 1, this.setDefaultVerticalResults );
		this.requestVerticalsThrottled = throttle( this.props.requestVerticals, 666, {
			leading: true,
			trailing: true,
		} );
		this.requestVerticalsDebounced = debounce( this.props.requestVerticals, 666 );
	}

	componentDidMount() {
		// If we have a stored vertical, grab the preview
		this.props.initialValue &&
			this.props.requestVerticals( this.props.initialValue, 1, this.setSearchResults );
	}

	setSearchResults = results => {
		this.setState( { results } );
	};

	setDefaultVerticalResults = defaultVertical => {
		this.setState( { defaultVertical } );
	};

	// When a user is keying through the results,
	// only update the vertical when they select a result.
	searchForVerticalMatches = ( value = '' ) =>
		find(
			this.state.results,
			item => item.verticalName.toLowerCase() === value.toLowerCase() && ! isEmpty( item.preview )
		);

	updateVerticalData = ( result, value ) =>
		this.props.onChange(
			result || {
				isUserInputVertical: true,
				parent: '',
				preview: get( this.state.defaultVertical, '[0].preview', '' ),
				verticalId: '',
				verticalName: value,
				verticalSlug: value,
			}
		);

	onSiteTopicChange = value => {
		value = trim( value );

		const hasValue = !! value;
		const valueLength = value.length || 0;
		const valueLengthShouldTriggerSearch = valueLength >= this.props.charsToTriggerSearch;
		const result = this.searchForVerticalMatches( value );

		// Cancel delayed invocations in case of deletion
		// and make sure the consuming component knows about it.
		if ( ! hasValue || ! valueLengthShouldTriggerSearch ) {
			this.requestVerticalsDebounced.cancel();
			this.requestVerticalsThrottled.cancel();
		}

		if (
			hasValue &&
			valueLengthShouldTriggerSearch &&
			// Don't trigger a search if there's already an exact, non-user-defined match from the API
			! result
		) {
			if ( valueLength < 5 ) {
				this.requestVerticalsThrottled(
					value,
					this.props.searchResultsLimit,
					this.setSearchResults
				);
			} else {
				this.requestVerticalsDebounced(
					value,
					this.props.searchResultsLimit,
					this.setSearchResults
				);
			}
		}

		this.setState( { searchValue: value } );
		this.updateVerticalData( result, value );
	};

	getSuggestions = () => this.state.results.map( vertical => vertical.verticalName );

	sortSearchResults = ( suggestionsArray, queryString ) => {
		let queryMatch;

		// first do the search, omit and cache exact matches
		queryString = queryString.trim().toLocaleLowerCase();
		const lazyResults = suggestionsArray.filter( val => {
			if ( val.toLocaleLowerCase() === queryString ) {
				queryMatch = val;
				return false;
			}
			return val.toLocaleLowerCase().includes( queryString );
		} );

		// second find the words that start with the search
		const startsWithResults = lazyResults.filter( val =>
			startsWith( val.toLocaleLowerCase(), queryString )
		);

		// merge, dedupe, bye
		return uniq(
			startsWithResults.concat( lazyResults.concat( queryMatch ? [ queryMatch ] : [] ) )
		);
	};

	render() {
		const { translate, placeholder, autoFocus } = this.props;
		return (
			<SuggestionSearch
				id="siteTopic"
				placeholder={ placeholder || translate( 'e.g. Fashion, travel, design, plumbing' ) }
				onChange={ this.onSiteTopicChange }
				suggestions={ this.getSuggestions() }
				value={ this.state.searchValue }
				sortResults={ this.sortSearchResults }
				autoFocus={ autoFocus } // eslint-disable-line jsx-a11y/no-autofocus
			/>
		);
	}
}
export function requestVerticals( search, limit = 7, callback ) {
	request
		.get( 'https://public-api.wordpress.com/wpcom/v2/verticals' )
		.query( { _envelope: 1, search, limit, include_preview: true } )
		.then( res => {
			SiteVerticalsSuggestionSearch.isSearchPending = false;
			callback( convertToCamelCase( get( res.body, 'body', [] ) ) );
		} )
		.catch( err => {
			debug( err );
			SiteVerticalsSuggestionSearch.isSearchPending = false;
		} );
}

export function isVerticalSearchPending() {
	return SiteVerticalsSuggestionSearch.isSearchPending;
}

export default localize(
	connect(
		null,
		() => ( {
			requestVerticals,
		} )
	)( SiteVerticalsSuggestionSearch )
);
