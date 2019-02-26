/**
 * External dependencies
 */
import moment from 'moment-timezone';

/**
 * @typedef OffsetParams
 * @property {?string} timezone  Timezone representation to apply.
 * @property {?string} gmtOffset Offset to apply if timezone isn't supplied.
 */

/**
 * Accepts nullable timezone and offset and applies one to the provided moment, preferring the
 * timezone. If neither are provided, return the moment unchanged.
 *
 * @param  {MomentInput}  input Valid input for moment (string, timestamp, moment.js object)
 *                        to which timezone or offset will be applied.
 * @param  {OffsetParams} params Parameters
 * @return {Object}       Moment with timezone applied if provided.
 *                        Moment with gmtOffset applied if no timezone is provided.
 *                        If neither is provided, the original moment is returned.
 */
export function adjustDateOffset( input, { timezone, gmtOffset } ) {
	if ( timezone ) {
		return moment.tz( input, timezone );
	}
	if ( gmtOffset ) {
		return moment( input ).utcOffset( gmtOffset );
	}
	return moment( input );
}
