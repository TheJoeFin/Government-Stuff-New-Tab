class MilwaukeeCouncil {
  constructor() {
    this.committeeDescriptions = this.getCommitteeDescriptions()
    this.members = this.getCouncilMembers()
  }

  getCommitteeDescriptions() {
    return {
      "Finance and Personnel Committee":
        "Oversees city budget, fiscal policy, spending, and personnel matters.",
      "Public Safety and Health Committee":
        "Handles police, fire, EMS, emergency management, and public health policy.",
      "Licenses Committee":
        "Reviews and acts on alcohol, food, and business licenses; compliance and revocations.",
      "Judiciary and Legislation Committee":
        "Reviews ordinances, litigation, legal matters, and city positions on state/federal legislation.",
      "Zoning, Neighborhoods, and Development Committee":
        "Oversees land use, zoning changes, development projects, and neighborhood planning.",
      "Community and Economic Development Committee":
        "Advances housing, workforce, small business growth, and community development programs.",
      "Public Works Committee":
        "Oversees streets, sanitation, transportation, water/sewer, and city infrastructure (DPW).",
      "Capital Improvements Committee":
        "Plans and prioritizes capital projects and related financing/bonding.",
      "Steering and Rules Committee":
        "Sets Council rules and agendas; handles referrals and leadership matters.",
      "Historic Preservation Commission":
        "Designates historic properties and reviews alterations within historic districts.",
      "Frank P. Zeidler Public Service Award Selection":
        "Selects honorees for the City's annual public service award.",
      "Historic Third Ward Architectural Review Board":
        "Reviews building design and alterations in the Historic Third Ward.",
      "Joint Committee on the Redevelopment of Abandoned & Foreclosed Homes":
        "Coordinates programs to rehabilitate and dispose of vacant or foreclosed properties.",
      "Public Transportation, Utilities & Waterways Review Board":
        "Reviews issues related to transit, utilities, and waterways.",
      "Housing Trust Fund Advisory Board":
        "Advises on allocation of local funds to expand affordable housing.",
      "Wisconsin Center District Board":
        "Oversees convention center and district facilities and financing.",
      "VISIT Milwaukee Board of Directors":
        "Regional tourism promotion and convention/visitor marketing oversight.",
      "Redevelopment Authority of the City of Milwaukee":
        "Leads redevelopment, project financing, and tax-increment districts.",
      "Library Board":
        "Governs Milwaukee Public Library policy and operations.",
      "Neighborhood Improvement Development Corporation Board":
        "Supports neighborhood housing and commercial improvement programs.",
      "Board of Harbor Commissioners":
        "Oversees Port Milwaukee operations and maritime economic development.",
      "Administrative Review Board of Appeals":
        "Hears appeals of administrative determinations under city ordinances.",
      "Anti-Graffiti Policy Committee":
        "Coordinates policy and programs to prevent and abate graffiti.",
      "NLC Transportation & Infrastructure Services Committee":
        "National League of Cities committee on transportation and infrastructure.",
      "Hispanic Elected Local Officials":
        "NLC constituency group for Hispanic local leaders.",
      "Milwaukee Area Technical College Board":
        "Governing board for the public technical college district.",
      "Historic Third Ward ARB":
        "Alias: Historic Third Ward Architectural Review Board.",
    }
  }

  buildResponsibilities(member) {
    const resps = []
    if (!member.committees) return resps
    member.committees.forEach((c) => {
      const desc = this.committeeDescriptions[c.name] || ""
      const roleTxt = c.role ? `${c.role}: ` : ""
      if (desc) {
        resps.push(`${roleTxt}${c.name} — ${desc}`)
      } else {
        resps.push(`${roleTxt}${c.name}`)
      }
    })
    return resps
  }

  getCouncilMembers() {
    const members = [
      {
        name: "Andrea M. Pratt",
        district: 1,
        title: "Alderwoman, District 1",
        website: "https://city.milwaukee.gov/District1",
        email: null,
        phone: null,
        committees: [
          { role: "Vice Chair", name: "Licenses Committee" },
          { role: "Member", name: "Judiciary and Legislation Committee" },
        ],
      },
      {
        name: "Mark Chambers, Jr.",
        district: 2,
        title: "Alderman, District 2",
        website: "https://city.milwaukee.gov/District2",
        email: null,
        phone: null,
        committees: [
          { role: "Vice Chair", name: "Judiciary and Legislation Committee" },
          {
            role: "Member",
            name: "Community and Economic Development Committee",
          },
          { role: "Member", name: "Licenses Committee" },
        ],
      },
      {
        name: "Alex Brower",
        district: 3,
        title: "Alderman, District 3",
        website: "https://city.milwaukee.gov/District3",
        email: null,
        phone: null,
        committees: [
          { role: "Member", name: "Licenses Committee" },
          { role: "Member", name: "Public Works Committee" },
        ],
      },
      {
        name: "Robert Bauman",
        district: 4,
        title: "Alderman, District 4",
        website: "https://city.milwaukee.gov/District4",
        email: null,
        phone: null,
        committees: [
          {
            role: "Chair",
            name: "Zoning, Neighborhoods, and Development Committee",
          },
          { role: "Chair", name: "Capital Improvements Committee" },
          {
            role: "Chair",
            name: "Frank P. Zeidler Public Service Award Selection",
          },
          {
            role: "Chair",
            name: "Historic Third Ward Architectural Review Board",
          },
          {
            role: "Chair",
            name: "Joint Committee on the Redevelopment of Abandoned & Foreclosed Homes",
          },
          {
            role: "Chair",
            name: "Public Transportation, Utilities & Waterways Review Board",
          },
          { role: "Member", name: "Judiciary and Legislation Committee" },
          { role: "Member", name: "Public Works Committee" },
          { role: "Member", name: "Steering and Rules Committee" },
          { role: "Member", name: "Historic Preservation Commission" },
          { role: "Member", name: "Housing Trust Fund Advisory Board" },
          { role: "Member", name: "Wisconsin Center District Board" },
          {
            role: "Member",
            name: "NLC Transportation & Infrastructure Services Committee",
          },
        ],
      },
      {
        name: "Lamont Westmoreland",
        district: 5,
        title: "Alderman, District 5",
        website: "https://city.milwaukee.gov/District5",
        email: null,
        phone: null,
        committees: [
          { role: "Vice Chair", name: "Public Works Committee" },
          { role: "Member", name: "Judiciary and Legislation Committee" },
          { role: "Member", name: "Public Safety and Health Committee" },
          { role: "Board Member", name: "VISIT Milwaukee Board of Directors" },
          {
            role: "Board Member",
            name: "Redevelopment Authority of the City of Milwaukee",
          },
        ],
      },
      {
        name: "Milele A. Coggs",
        district: 6,
        title: "Alderwoman, District 6",
        website: "https://city.milwaukee.gov/District6",
        email: null,
        phone: null,
        committees: [
          { role: "Member", name: "Finance and Personnel Committee" },
          { role: "Member", name: "Public Works Committee" },
          {
            role: "Member",
            name: "Joint Committee on the Redevelopment of Abandoned & Foreclosed Homes",
          },
          { role: "Member", name: "Library Board" },
          {
            role: "Member",
            name: "Neighborhood Improvement Development Corporation Board",
          },
          { role: "Member", name: "Wisconsin Center District Board" },
        ],
      },
      {
        name: "DiAndre Jackson",
        district: 7,
        title: "Alderman, District 7",
        website: "https://city.milwaukee.gov/District7",
        email: null,
        phone: null,
        committees: [
          { role: "Chair", name: "Judiciary and Legislation Committee" },
          {
            role: "Member",
            name: "Community and Economic Development Committee",
          },
          {
            role: "Member",
            name: "Zoning, Neighborhoods, and Development Committee",
          },
          { role: "Member", name: "Steering and Rules Committee" },
        ],
      },
      {
        name: "JoCasta Zamarripa",
        district: 8,
        title: "Alderwoman, District 8",
        website: "https://city.milwaukee.gov/District8",
        email: null,
        phone: null,
        committees: [
          { role: "Chair", name: "Licenses Committee" },
          {
            role: "Vice Chair",
            name: "Community and Economic Development Committee",
          },
          {
            role: "Member",
            name: "Zoning, Neighborhoods, and Development Committee",
          },
          { role: "Member", name: "Steering and Rules Committee" },
        ],
      },
      {
        name: "Larresa Taylor",
        district: 9,
        title: "Alderwoman, District 9",
        website: "https://city.milwaukee.gov/District9",
        email: null,
        phone: null,
        committees: [
          { role: "Member", name: "Public Works Committee" },
          { role: "Member", name: "Public Safety and Health Committee" },
          { role: "Member", name: "Library Board" },
        ],
      },
      {
        name: "Sharlen P. Moore",
        district: 10,
        title: "Alderwoman, District 10",
        website: "https://city.milwaukee.gov/District10",
        email: null,
        phone: null,
        committees: [
          { role: "Member", name: "Finance and Personnel Committee" },
          { role: "Member", name: "Public Safety and Health Committee" },
        ],
      },
      {
        name: "Peter Burgelis",
        district: 11,
        title: "Alderman, District 11",
        website: "https://city.milwaukee.gov/District11",
        email: "Peter.Burgelis@milwaukee.gov",
        phone: "414-286-3768",
        committees: [
          { role: "Vice Chair", name: "Finance and Personnel Committee" },
          { role: "Vice Chair", name: "Public Safety and Health Committee" },
          { role: "Member", name: "Licenses Committee" },
          { role: "Member", name: "Board of Harbor Commissioners" },
        ],
      },
      {
        name: "José G. Pérez",
        district: 12,
        title: "Alderman, District 12 — Council President",
        website: "https://city.milwaukee.gov/District12",
        email: "JPerez@milwaukee.gov",
        phone: "414-286-2861",
        committees: [
          { role: "Chair", name: "Steering and Rules Committee" },
          {
            role: "Chair",
            name: "Zoning, Neighborhoods, and Development Committee",
          },
          { role: "Member", name: "Anti-Graffiti Policy Committee" },
          { role: "Board Member", name: "Hispanic Elected Local Officials" },
          {
            role: "Board Member",
            name: "Milwaukee Area Technical College Board",
          },
        ],
      },
      {
        name: "Scott Spiker",
        district: 13,
        title: "Alderman, District 13",
        website: "https://city.milwaukee.gov/District13",
        email: "scott.spiker@milwaukee.gov",
        phone: "414-286-8537",
        committees: [
          { role: "Chair", name: "Public Safety and Health Committee" },
          { role: "Vice Chair", name: "Finance and Personnel Committee" },
          { role: "Member", name: "Steering and Rules Committee" },
          { role: "Member", name: "Licenses Committee" },
          { role: "Member", name: "Administrative Review Board of Appeals" },
        ],
      },
      {
        name: "Marina Dimitrijevic",
        district: 14,
        title: "Alderwoman, District 14",
        website: "https://city.milwaukee.gov/District14",
        email: "Marina@milwaukee.gov",
        phone: "414-286-3769",
        committees: [
          { role: "Chair", name: "Finance and Personnel Committee" },
          { role: "Vice Chair", name: "Steering and Rules Committee" },
          {
            role: "Member",
            name: "Community and Economic Development Committee",
          },
        ],
      },
      {
        name: "Russell W. Stamper, II",
        district: 15,
        title: "Alderman, District 15",
        website: "https://city.milwaukee.gov/District15",
        email: null,
        phone: null,
        committees: [
          {
            role: "Chair",
            name: "Community and Economic Development Committee",
          },
          {
            role: "Vice Chair",
            name: "Zoning, Neighborhoods, and Development Committee",
          },
          { role: "Member", name: "Steering and Rules Committee" },
        ],
      },
    ]

    return members.map((m) => {
      const responsibilities = this.buildResponsibilities(m)
      return {
        name: m.name,
        title: m.title,
        department: "Milwaukee Common Council",
        district: m.district,
        responsibilities,
        contact: {
          website: m.website,
          email: m.email || undefined,
          phone: m.phone || undefined,
          office: "City Hall, 200 E Wells St, Room 205, Milwaukee, WI 53202",
        },
        _raw: m,
      }
    })
  }

  getMembers() {
    return this.members
  }

  searchMembers(query) {
    if (!query || query.trim().length < 2) return []
    const q = query.toLowerCase()
    const results = []
    this.members.forEach((m) => {
      const committeesText = (m._raw.committees || [])
        .map((c) => `${c.role || "Member"} ${c.name}`)
        .join(" ")
        .toLowerCase()
      const committeeDescs = (m._raw.committees || [])
        .map((c) => this.committeeDescriptions[c.name] || "")
        .join(" ")
        .toLowerCase()
      const searchable = [
        m.name,
        m.title,
        m.department,
        committeesText,
        committeeDescs,
        ...(m.responsibilities || []),
      ]
        .join(" ")
        .toLowerCase()
      if (searchable.includes(q)) {
        // Tag with level for coloring in the UI
        results.push({ ...m, level: "city" })
      }
    })
    return results
  }
}
