class MilwaukeeSchoolBoard {
  constructor() {
    this.members = this.getBoardMembers()
  }

  getBoardMembers() {
    // Source: https://www.milwaukeepublicschools.org/about/board/directors
    const website = "https://www.milwaukeepublicschools.org/about/board/directors"
    const officeAddress = "5225 W. Vliet Street, Milwaukee, WI 53208"
    const email = "governance@milwaukeepublicschools.org"
    const phone = "414-475-8284"

    const members = [
      {
        name: "Missy Zombor",
        district: "At-Large",
        title: "President, School Board",
        role: "President",
      },
      {
        name: "Dr. James Ferguson",
        district: 4,
        title: "Vice President, School Board — District 4",
        role: "Vice President",
      },
      {
        name: "Marva Herndon",
        district: 1,
        title: "School Board Director, District 1",
        role: "Member",
      },
      {
        name: "Erika Siemsen",
        district: 2,
        title: "School Board Director, District 2",
        role: "Member",
      },
      {
        name: "Darryl L. Jackson",
        district: 3,
        title: "School Board Director, District 3",
        role: "Member",
      },
      {
        name: "Christopher Fons",
        district: 5,
        title: "School Board Director, District 5",
        role: "Member",
      },
      {
        name: "Mimi Reza",
        district: 6,
        title: "School Board Director, District 6",
        role: "Member",
      },
      {
        name: "Dr. Kate Vannoy",
        district: 7,
        title: "School Board Director, District 7",
        role: "Member",
      },
      {
        name: "Megan O'Halloran",
        district: 8,
        title: "School Board Director, District 8",
        role: "Member",
      },
    ]

    return members.map((m) => {
      return {
        name: m.name,
        title: m.title,
        department: "Milwaukee Public Schools Board of School Directors",
        district: m.district,
        responsibilities: [
          `${m.role} of the Milwaukee Public Schools Board of School Directors`,
          "Sets district policy, budget, and academic goals for Milwaukee Public Schools",
          "Hires and oversees the Superintendent",
        ],
        contact: {
          website,
          email,
          phone,
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
      const searchable = [
        m.name,
        m.title,
        m.department,
        m._raw.district,
        ...(m.responsibilities || []),
      ]
        .join(" ")
        .toLowerCase()
      if (searchable.includes(q)) {
        results.push({ ...m, level: "schools" })
      }
    })
    return results
  }
}
