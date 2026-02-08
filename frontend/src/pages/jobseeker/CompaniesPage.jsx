import { useEffect, useState } from "react";
import axios from "axios";

function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [cultureData, setCultureData] = useState({});
  const [attributesData, setAttributesData] = useState({});
  const [benefitsData, setBenefitsData] = useState({});
  const [reviewsData, setReviewsData] = useState({});
  const [valuesData, setValuesData] = useState({});

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/companies");
      setCompanies(res.data);
    } catch (err) {
      console.error("Error fetching companies", err);
    }
  };

  // Fetch company details
  const fetchCompanyDetails = async (companyId) => {
    try {
      const cultureRes = await axios.get(
        `http://localhost:5000/api/companies/${companyId}/culture`
      );

      const attrRes = await axios.get(
        `http://localhost:5000/api/companies/${companyId}/attributes`
      );

      const benefitsRes = await axios.get(
        `http://localhost:5000/api/companies/${companyId}/benefits`
      );

      const reviewsRes = await axios.get(
        `http://localhost:5000/api/companies/${companyId}/reviews`
      );

      const valuesRes = await axios.get(
        `http://localhost:5000/api/companies/${companyId}/values`
      );

      setCultureData(prev => ({
        ...prev,
        [companyId]: cultureRes.data
      }));

      setAttributesData(prev => ({
        ...prev,
        [companyId]: attrRes.data
      }));

      setBenefitsData(prev => ({
        ...prev,
        [companyId]: benefitsRes.data
      }));

      setReviewsData(prev => ({
        ...prev,
        [companyId]: reviewsRes.data
      }));

      setValuesData(prev => ({
        ...prev,
        [companyId]: valuesRes.data
      }));

    } catch (err) {
      console.error("Error fetching company details", err);
    }
  };

  const handleCardClick = (companyId) => {
    if (expandedId === companyId) {
      setExpandedId(null);
    } else {
      setExpandedId(companyId);
      fetchCompanyDetails(companyId);
    }
  };

  // Vote function
  const voteReview = async (reviewId, isHelpful, companyId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/reviews/${reviewId}/helpful`,
        { is_helpful: isHelpful }
      );

      console.log("Vote success:", res.data);

      // Refresh reviews
      fetchCompanyDetails(companyId);

    } catch (err) {
      console.error("Vote error:", err.response?.data || err.message);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Companies</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-gray-900 p-3 rounded w-full mb-4 outline-none"
      />

      {/* Company Cards */}
      {filteredCompanies.map(company => {
        const culture = cultureData[company.id];
        const attributes = attributesData[company.id];
        const benefits = benefitsData[company.id];
        const reviews = reviewsData[company.id];
        const values = valuesData[company.id];

        return (
          <div
            key={company.id}
            onClick={() => handleCardClick(company.id)}
            className="bg-gray-900 p-5 rounded-lg mb-4 cursor-pointer hover:bg-gray-800 transition"
          >
            <h2 className="text-xl font-semibold">{company.name}</h2>
            <p><b>Industry:</b> {company.industry}</p>
            <p><b>HQ:</b> {company.headquarters}</p>

            {expandedId === company.id && culture && (
              <div className="bg-gray-800 mt-4 p-4 rounded-lg">

                {/* Ratings */}
                <div className="mb-3 space-y-1">
                  <p>⭐ Overall Rating: {culture.overall_rating}</p>
                  <p>🏢 Culture Score: {culture.culture_score}/100</p>
                  <p>⚖ Work-Life Balance: {culture.work_life_balance_score}</p>
                  <p>📈 Career Growth: {culture.career_growth_score}</p>
                </div>

                {/* Attributes */}
                {attributes?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {attributes.map(attr => (
                      <span
                        key={attr.attribute_name}
                        className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                      >
                        {attr.attribute_name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Benefits */}
                {benefits?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-lg">
                      🎁 Benefits
                    </h3>
                    {benefits.map(benefit => (
                      <div key={benefit.benefit_name} className="mb-2 text-sm">
                        <div className="font-medium">
                          ✔ {benefit.benefit_name}
                        </div>
                        <div className="text-gray-400 ml-5">
                          {benefit.benefit_description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Company Values */}
                {values?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-lg">
                      🌟 Company Values
                    </h3>
                    {values.map(value => (
                      <div
                        key={value.id}
                        className="bg-gray-700 p-3 rounded mb-2 text-sm"
                      >
                        <div className="font-medium">
                          {value.value_name}
                        </div>
                        <div className="text-gray-400">
                          {value.value_description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reviews */}
                {reviews?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-lg">
                      🗣 Employee Reviews
                    </h3>

                    {reviews.map(review => (
                      <div
                        key={review.id}
                        className="bg-gray-700 p-3 rounded mb-3 text-sm"
                      >
                        <p>
                          <b>{review.job_title}</b> — {review.location}
                        </p>
                        <p>⭐ Rating: {review.overall_rating}/5</p>

                        <p className="text-green-400">
                          <b>Pros:</b> {review.pros}
                        </p>

                        <p className="text-red-400">
                          <b>Cons:</b> {review.cons}
                        </p>

                        {/* Helpful counts */}
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          <span>👍 {review.helpful_count || 0}</span>
                          <span>👎 {review.not_helpful_count || 0}</span>
                        </div>

                        {/* Buttons */}
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              voteReview(review.id, true, company.id);
                            }}
                            className="bg-green-600 px-2 py-1 rounded text-white"
                          >
                            👍 Helpful
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              voteReview(review.id, false, company.id);
                            }}
                            className="bg-red-600 px-2 py-1 rounded text-white"
                          >
                            👎 Not Helpful
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CompaniesPage;
