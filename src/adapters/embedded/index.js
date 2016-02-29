function EmbeddedAdapter(config) {
    return {
        name: 'embedded',
        read: require('./read')(config)
    };
}

module.exports = EmbeddedAdapter;
