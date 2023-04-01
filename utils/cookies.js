module.exports.getCookieValue = (cookie, name) => (
    cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
);
