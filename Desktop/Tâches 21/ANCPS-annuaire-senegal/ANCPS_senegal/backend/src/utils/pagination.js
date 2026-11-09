function getPagination(req) {
    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 6;

    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
}

module.exports = getPagination;