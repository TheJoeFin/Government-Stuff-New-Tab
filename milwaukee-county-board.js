class MilwaukeeCountyBoard {
  constructor() {
    this.committeeDescriptions = this.getCommitteeDescriptions()
    this.members = this.getSupervisors()
  }

  getCommitteeDescriptions() {
    return {
      Audit:
        "Reviews county audit reports, ensures improvements and cost-savings are implemented, and tracks racial equity and health progress.",
      "Community, Environment and Economic Development":
        "Oversees housing programs (incl. CDBG), economic development policy, disposition of surplus county lands, and environmental protection.",
      Finance:
        "Reviews County budget, taxation, and insurance; leads deliberations and recommendations on the annual County budget.",
      "Health Equity, Human Needs and Strategic Planning":
        "Policy for Health & Human Services: behavioral health, aging, housing, youth/family services, disabilities, veterans, and management services.",
      "Intergovernmental Relations":
        "Reviews proposed federal, state, and local legislation affecting the County and sets County policy positions.",
      "Judiciary, Law Enforcement and General Services":
        "Legal claims and policy for courts services, family court, jury, probate, elections, register of deeds, sheriff, medical examiner, DA, House of Correction, child support, corp. counsel, emergency management.",
      "Parks and Culture":
        "Policy for County Parks, recreation, cultural activities, arts, University Extension, and Zoo services.",
      Personnel:
        "Employment conditions, compensation, classification/pay, benefits; HR, employee benefits, and labor relations policy.",
      "Transportation and Transit":
        "DOT: highways, airports, bridges; mass transit policy (MCTS) including fares, routes, capital; airports, railroads, and public utilities.",
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

  getSupervisors() {
    // Source: https://county.milwaukee.gov/EN/Board-of-Supervisors/Board-Members
    // Standing Committees: https://county.milwaukee.gov/EN/Board-of-Supervisors/Standing-Committees
    const website =
      "https://county.milwaukee.gov/EN/Board-of-Supervisors/Board-Members"
    const officeAddress =
      "Courthouse, Room 201, 901 N 9th St, Milwaukee, WI 53233"

    const members = [
      {
        name: "Anne O'Connor",
        district: 1,
        title: "Supervisor, District 1",
        website,
        committees: [
          { role: "Member", name: "Finance" },
          { role: "Vice Chair", name: "Intergovernmental Relations" },
          { role: "Member", name: "Parks and Culture" },
        ],
      },
      {
        name: "Willie Johnson, Jr.",
        district: 2,
        title: "Supervisor, District 2",
        website,
        committees: [
          { role: "Chair", name: "Finance" },
          {
            role: "Member",
            name: "Judiciary, Law Enforcement and General Services",
          },
          { role: "Member", name: "Personnel" },
        ],
      },
      {
        name: "Sheldon A. Wasserman",
        district: 3,
        title: "Supervisor, District 3",
        website,
        committees: [
          { role: "Chair", name: "Parks and Culture" },
          { role: "Member", name: "Personnel" },
        ],
      },
      {
        name: "Jack Eckblad",
        district: 4,
        title: "Supervisor, District 4",
        website,
        committees: [
          { role: "Chair", name: "Audit" },
          { role: "Member", name: "Parks and Culture" },
          { role: "Member", name: "Transportation and Transit" },
        ],
      },
      {
        name: "Sequanna Taylor",
        district: 5,
        title: "Supervisor, District 5",
        website,
        committees: [
          { role: "Member", name: "Finance" },
          { role: "Member", name: "Intergovernmental Relations" },
        ],
      },
      {
        name: "Shawn Rolland",
        district: 6,
        title: "Supervisor, District 6",
        website,
        committees: [
          {
            role: "Chair",
            name: "Health Equity, Human Needs and Strategic Planning",
          },
          { role: "Member", name: "Finance" },
          { role: "Member", name: "Audit" },
        ],
      },
      {
        name: "Felesia A. Martin",
        district: 7,
        title: "Supervisor, District 7",
        website,
        committees: [
          { role: "Vice Chair", name: "Audit" },
          {
            role: "Member",
            name: "Health Equity, Human Needs and Strategic Planning",
          },
          { role: "Member", name: "Parks and Culture" },
          { role: "Member", name: "Personnel" },
        ],
      },
      {
        name: "Steven Shea",
        district: 8,
        title: "Supervisor, District 8 — 1st Vice-Chair",
        website,
        committees: [
          { role: "Chair", name: "Transportation and Transit" },
          { role: "Member", name: "Finance" },
          {
            role: "Member",
            name: "Community, Environment and Economic Development",
          },
          { role: "Member", name: "Intergovernmental Relations" },
        ],
      },
      {
        name: "Patti Logsdon",
        district: 9,
        title: "Supervisor, District 9",
        website,
        committees: [
          { role: "Chair", name: "Personnel" },
          {
            role: "Member",
            name: "Community, Environment and Economic Development",
          },
          {
            role: "Member",
            name: "Judiciary, Law Enforcement and General Services",
          },
        ],
      },
      {
        name: "Marcelia Nicholson",
        district: 10,
        title: "Supervisor, District 10 — Board Chairwoman",
        website,
        committees: [],
      },
      {
        name: "Kathleen Vincent",
        district: 11,
        title: "Supervisor, District 11",
        website,
        committees: [
          { role: "Vice Chair", name: "Personnel" },
          { role: "Member", name: "Audit" },
          {
            role: "Member",
            name: "Health Equity, Human Needs and Strategic Planning",
          },
        ],
      },
      {
        name: "Juan Miguel Martinez",
        district: 12,
        title: "Supervisor, District 12",
        website,
        committees: [
          { role: "Vice Chair", name: "Transportation and Transit" },
          { role: "Member", name: "Finance" },
          {
            role: "Member",
            name: "Judiciary, Law Enforcement and General Services",
          },
          { role: "Member", name: "Parks and Culture" },
        ],
      },
      {
        name: "Priscilla E. Coggs-Jones",
        district: 13,
        title: "Supervisor, District 13 — 2nd Vice-Chair",
        website,
        committees: [
          { role: "Member", name: "Intergovernmental Relations" },
          { role: "Member", name: "Parks and Culture" },
          { role: "Member", name: "Transportation and Transit" },
        ],
      },
      {
        name: "Caroline Gómez-Tom",
        district: 14,
        title: "Supervisor, District 14",
        website,
        committees: [
          { role: "Chair", name: "Intergovernmental Relations" },
          {
            role: "Vice Chair",
            name: "Community, Environment and Economic Development",
          },
          {
            role: "Vice Chair",
            name: "Health Equity, Human Needs and Strategic Planning",
          },
        ],
      },
      {
        name: "Sky Z. Capriolo",
        district: 15,
        title: "Supervisor, District 15",
        website,
        committees: [
          {
            role: "Vice Chair",
            name: "Judiciary, Law Enforcement and General Services",
          },
          { role: "Member", name: "Audit" },
          {
            role: "Member",
            name: "Community, Environment and Economic Development",
          },
        ],
      },
      {
        name: "Justin Bielinski",
        district: 16,
        title: "Supervisor, District 16",
        website,
        committees: [
          {
            role: "Chair",
            name: "Judiciary, Law Enforcement and General Services",
          },
          { role: "Member", name: "Finance" },
          { role: "Member", name: "Transportation and Transit" },
        ],
      },
      {
        name: "Steve F. Taylor",
        district: 17,
        title: "Supervisor, District 17",
        website,
        committees: [
          {
            role: "Chair",
            name: "Community, Environment and Economic Development",
          },
          { role: "Vice Chair", name: "Finance" },
          { role: "Vice Chair", name: "Parks and Culture" },
        ],
      },
      {
        name: "Deanna Alexander",
        district: 18,
        title: "Supervisor, District 18",
        website,
        committees: [
          { role: "Member", name: "Audit" },
          {
            role: "Member",
            name: "Health Equity, Human Needs and Strategic Planning",
          },
        ],
      },
    ]

    return members.map((m) => {
      const responsibilities = this.buildResponsibilities(m)
      return {
        name: m.name,
        title: m.title,
        department: "Milwaukee County Board of Supervisors",
        district: m.district,
        responsibilities,
        contact: {
          website: m.website,
          office: officeAddress,
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
        results.push({ ...m, level: "county" })
      }
    })
    return results
  }
}
