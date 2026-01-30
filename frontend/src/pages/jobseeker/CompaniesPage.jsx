import { useEffect, useState } from "react";
import axios from "axios";

function CompaniesPage() {

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");

  const [cultureScores, setCultureScores] = useState({});
  const [attributes, setAttributes] = useState({});

  // Load companies on page load
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/companies");
      setCompanies(res.data);

      // Fetch culture data + attributes for each company
      res.data.forEach(company => {
        fetchCultureScore(company.id);
        fetchAttributes(company.id);
      });

    } catch (err) {
      console.error("Error fetching companies", err);
    }
  };

  // Fetch culture scores
  const fetchCultureScore = async (companyId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/companies/${companyId}/culture`
      );

      setCultureScores(prev => ({
        ...prev,
        [companyId]: res.data
      }));

    } catch (err) {
      console.error("Culture fetch error", err);
    }
  };

  // Fetch culture attributes (tags)
  const fetchAttributes = async (companyId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/companies/${companyId}/attributes`
      );

      setAttributes(prev => ({
        ...prev,
        [companyId]: res.data
      }));

    } catch (err) {
      console.error("Attribute fetch error", err);
    }
  };

  // Search filter
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Companies</h1>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-gray-900 p-3 rounded w-full mb-5"
      />

      {/* Company Cards */}
      {filteredCompanies.map(company => {

        const score = cultureScores[company.id];

        return (
          <div
            key={company.id}
            className="bg-gray-900 p-5 rounded-lg mb-5"
          >

            {/* Company Info */}
            <h2 className="text-xl font-semibold">{company.name}</h2>

            <p><b>Industry:</b> {company.industry}</p>
            <p><b>HQ:</b> {company.headquarters}</p>

            <p className="text-gray-400 mt-2">
              {company.description}
            </p>

            {/* Ratings Section */}
            {score && (
              <div className="mt-4 bg-gray-800 p-4 rounded-lg">

                <p>⭐ <b>Overall Rating:</b> {score.overall_rating}</p>
                <p>📊 <b>Culture Score:</b> {score.culture_score}/100</p>
                <p>⚖ <b>Work-Life Balance:</b> {score.work_life_balance_score}</p>
                <p>📈 <b>Career Growth:</b> {score.career_growth_score}</p>

              </div>
            )}

            {/* Culture Attributes Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {attributes[company.id]?.map((attr, index) => (
                <span
                  key={index}
                  className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                >
                  {attr.attribute_name}
                </span>
              ))}
            </div>

          </div>
        );
      })}

    </div>
  );
}

export default CompaniesPage;
