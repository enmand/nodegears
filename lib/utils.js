/**
 * Utility or helpers to assist in different packages
 *
 * @author Velsoft Training Materials
 */
Object.prototype.findByValue = function(value)
{
	for(i in this)
	{
		if(this[i].toString() == value.toString())
			return true;
	}
	return false;
}
