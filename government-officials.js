/**
 * Government Officials Data Module
 * Contains comprehensive information about government officials at all levels
 * Data sourced from issue #2
 */
class GovernmentOfficials {
  constructor() {
    this.officials = {
      city: this.getCityOfficials(),
      county: this.getCountyOfficials(),
      state: this.getStateOfficials(),
      federal: this.getFederalOfficials(),
    }
  }

  /**
   * Get all officials for a specific level of government
   * @param {string} level - 'city', 'county', 'state', or 'federal'
   * @returns {Array} Array of officials
   */
  getOfficialsByLevel(level) {
    return this.officials[level] || []
  }

  /**
   * Get all officials across all levels
   * @returns {Object} Object containing all officials grouped by level
   */
  getAllOfficials() {
    return this.officials
  }

  /**
   * Search for officials by name, title, or department
   * @param {string} query - Search query
   * @returns {Array} Array of matching officials
   */
  searchOfficials(query) {
    const searchTerm = query.toLowerCase()
    const results = []

    Object.entries(this.officials).forEach(([level, officials]) => {
      officials.forEach((official) => {
        const searchableText = [
          official.name,
          official.title,
          official.department,
          ...(official.responsibilities || []),
        ]
          .join(" ")
          .toLowerCase()

        if (searchableText.includes(searchTerm)) {
          results.push({ ...official, level })
        }
      })
    })

    return results
  }

  getCityOfficials() {
    return [
      {
        name: "Cavalier Johnson",
        title: "Mayor",
        term_start: "2022-04-13",
        term_length_years: 4,
        responsibilities: [
          "Chief Executive of the City",
          "Oversees all city departments",
          "Proposes city budget",
          "Represents Milwaukee in official matters",
        ],
        contact: {
          email: "mayor@milwaukee.gov",
          phone: "414-286-2200",
          office: "City Hall, 200 E Wells St, Milwaukee, WI 53202",
        },
      },
      {
        name: "Evan Goyke",
        title: "City Attorney",
        department: "Office of the City Attorney",
        responsibilities: [
          "Serves as chief legal counsel to the City",
          "Represents the City in legal matters",
          "Prepares and reviews legislation and contracts",
        ],
        contact: {
          website: "https://city.milwaukee.gov/CityAttorney",
          office: "City Hall, 200 E Wells St, Milwaukee, WI 53202",
        },
      },
      {
        name: "Bill Christianson",
        title: "Comptroller",
        responsibilities: [
          "Leads independent financial oversight for the City",
          "Audits city departments and programs",
          "Issues fiscal reports and analyses",
          "Manages city debt issuance and fiscal strategy",
        ],
        contact: {
          email: "comptroller@milwaukee.gov",
          phone: "414-286-3321",
          office: "City Hall, 200 E Wells St, Room 404, Milwaukee, WI 53202",
        },
      },
      {
        name: "Spencer Coggs",
        title: "City Treasurer",
        responsibilities: [
          "Manages property tax billing and collection",
          "Oversees City cash management",
          "Provides taxpayer services and payment options",
        ],
        contact: {
          email: "ctreas@milwaukee.gov",
          phone: "414-286-2240",
          office: "City Hall, 200 E Wells St, Room 103, Milwaukee, WI 53202",
        },
      },
      {
        name: "José G. Pérez",
        title: "Common Council President",
        district: 12,
        responsibilities: [
          "Presides over Common Council meetings",
          "Appoints committee chairs",
          "Acts as Mayor when Mayor is unavailable",
          "Oversees legislative agenda",
        ],
        contact: {
          email: "jose.perez@milwaukee.gov",
          phone: "414-286-2221",
          office: "City Hall, Room 205, Milwaukee, WI 53202",
        },
      },
      {
        name: "Jerrel Kruschke",
        title: "Commissioner of Public Works",
        department: "Department of Public Works",
        responsibilities: [
          "Manages city infrastructure and maintenance",
          "Oversees sanitation, streets, and fleet services",
          "Implements public works projects",
        ],
        contact: {
          email: "dpwmilw@milwaukee.gov",
          phone: "414-286-2489",
          office: "841 N Broadway, Room 501, Milwaukee, WI 53202",
        },
      },
      {
        name: "Jeffrey B. Norman",
        title: "Chief of Police",
        department: "Milwaukee Police Department",
        responsibilities: [
          "Oversees law enforcement citywide",
          "Implements public safety strategies",
          "Manages police personnel and operations",
        ],
        contact: {
          phone: "414-933-4444",
          office: "749 W State St, Milwaukee, WI 53233",
          website:
            "https://city.milwaukee.gov/police/About-MPD/Command-Staff-Bios/Jeffrey-Norman",
        },
      },
      {
        name: "Aaron D. Lipski",
        title: "Fire Chief",
        department: "Milwaukee Fire Department",
        responsibilities: [
          "Directs fire suppression and emergency medical services",
          "Oversees fire prevention and safety education",
          "Manages department staffing and operations",
        ],
        contact: {
          phone: "414-286-8948",
          office: "711 W Wells St, Milwaukee, WI 53233",
          website:
            "https://city.milwaukee.gov/MFD/Aboutmfd/FireChiefAaronDLipski",
        },
      },
      {
        name: "Jim Owczarski",
        title: "City Clerk",
        department: "Office of the City Clerk",
        responsibilities: [
          "Maintains official city records",
          "Coordinates Common Council agendas and minutes",
          "Oversees licensing and public notices",
        ],
        contact: {
          email: "jowcza@milwaukee.gov",
          phone: "414-286-2998",
          office: "City Hall, Room 205, Milwaukee, WI 53202",
        },
      },
    ]
  }

  getCountyOfficials() {
    return [
      {
        name: "David Crowley",
        title: "County Executive",
        term_start: "2020-05-04",
        term_length_years: 4,
        responsibilities: [
          "Chief Executive of Milwaukee County",
          "Oversees all county departments and services",
          "Proposes and manages county budget",
          "Implements countywide policies",
        ],
        contact: {
          email: "countyexec@milwaukeecountywi.gov",
          phone: "414-278-4211",
          office:
            "Milwaukee County Courthouse, 901 N 9th St, Milwaukee, WI 53233",
        },
      },
      {
        name: "Marcelia Nicholson",
        title: "Chairwoman, Board of Supervisors",
        department: "Milwaukee County Board of Supervisors",
        responsibilities: [
          "Presides over County Board meetings",
          "Assigns standing and special committees",
          "Oversees legislative agenda and proceedings",
        ],
        contact: {
          website: "https://county.milwaukee.gov/EN/Board-of-Supervisors",
          office:
            "Milwaukee County Courthouse, Room 201, 901 N 9th St, Milwaukee, WI 53233",
        },
      },
      {
        name: "Denita R. Ball",
        title: "Sheriff",
        term_start: "2022-10-24",
        responsibilities: [
          "Leads Milwaukee County Sheriff's Office",
          "Provides law enforcement for county highways, parks, and institutions",
          "Manages Milwaukee County Jail and Detention Services",
          "Ensures security at the courthouse and airport",
        ],
        contact: {
          email: "sheriff@milwaukeecountywi.gov",
          phone: "414-278-4766",
          office: "821 W State St, Room 107, Milwaukee, WI 53233",
        },
      },
      {
        name: "Liz Sumner",
        title: "Comptroller",
        responsibilities: [
          "Provides independent financial oversight",
          "Prepares comprehensive annual financial reports",
          "Monitors budget performance and fiscal policy",
        ],
        contact: {
          email: "comptroller@milwaukeecountywi.gov",
          phone: "414-278-3001",
          office:
            "Milwaukee County Courthouse, Room 301, 901 N 9th St, Milwaukee, WI 53233",
        },
      },
      {
        name: "David Cullen",
        title: "County Treasurer",
        responsibilities: [
          "Acts as the County's banker and cash manager",
          "Invests public funds and manages liquidity",
          "Collects delinquent property taxes in suburban municipalities",
        ],
        contact: {
          phone: "414-278-4033",
          office:
            "Milwaukee County Courthouse, Room 102, 901 N 9th St, Milwaukee, WI 53233",
        },
      },
      {
        name: "George L. Christenson",
        title: "County Clerk",
        responsibilities: [
          "Issues marriage licenses and passports",
          "Registers lobbyists and maintains legislative records",
          "Records County Board proceedings",
          "Publishes ordinances and manages public bids",
        ],
        contact: {
          email: "county.clerk@milwaukeecountywi.gov",
          phone: "414-278-4067",
          office:
            "Milwaukee County Courthouse, Room 105, 901 N 9th St, Milwaukee, WI 53233",
        },
      },
      {
        name: "Anna Hodges",
        title: "Clerk of Circuit Court",
        responsibilities: [
          "Manages court records and filings",
          "Supports judges and attorneys",
          "Facilitates Circuit Court operations",
          "Provides public access to court services",
        ],
        contact: {
          email: "clerk.courts@wicourts.gov",
          phone: "414-278-5362",
          office:
            "Milwaukee County Courthouse, Room 104, 901 N 9th St, Milwaukee, WI 53233",
        },
      },
      {
        name: "Israel Ramón",
        title: "Register of Deeds",
        responsibilities: [
          "Records real estate documents",
          "Issues birth, death, and marriage certificates",
          "Maintains property ownership records",
        ],
        contact: {
          email: "ROD@milwaukeecountywi.gov",
          phone: "414-278-4021",
          office:
            "Milwaukee County Courthouse, Room 103, 901 N 9th St, Milwaukee, WI 53233",
        },
      },
      {
        name: "Kent Lovern",
        title: "District Attorney",
        responsibilities: [
          "Prosecutes criminal cases",
          "Represents the state in county legal matters",
          "Oversees victim advocacy and diversion programs",
        ],
        contact: {
          email: "milwaukee.da@da.wi.gov",
          phone: "414-278-4646",
          office: "821 W State St, Room 405, Milwaukee, WI 53233",
        },
      },
    ]
  }

  getStateOfficials() {
    return [
      {
        name: "Tony Evers",
        title: "Governor",
        party: "Democratic",
        term_start: "2019-01-07",
        term_end: "2027-01-04",
        responsibilities: [
          "Chief Executive of Wisconsin",
          "Oversees state agencies and departments",
          "Proposes state budget",
          "Signs or vetoes legislation",
        ],
        contact: {
          email: "govinfo@wisconsin.gov",
          phone: "608-266-1212",
          office: "115 East State Capitol, Madison, WI 53702",
        },
      },
      {
        name: "Sara Rodriguez",
        title: "Lieutenant Governor",
        party: "Democratic",
        term_start: "2023-01-02",
        responsibilities: [
          "Supports Governor's initiatives",
          "Serves on state commissions",
          "Acts as Governor when needed",
        ],
        contact: {
          email: "ltgov@wisconsin.gov",
          phone: "608-266-3516",
          office: "19 East State Capitol, Madison, WI 53702",
        },
      },
      {
        name: "Josh Kaul",
        title: "Attorney General",
        party: "Democratic",
        term_start: "2019-01-07",
        responsibilities: [
          "Chief legal officer of the state",
          "Represents Wisconsin in legal matters",
          "Oversees Department of Justice",
        ],
        contact: {
          email: "dojinfo@doj.state.wi.us",
          phone: "608-266-1221",
          office: "Wisconsin DOJ, 17 W Main St, Madison, WI 53703",
        },
      },
      {
        name: "Sarah Godlewski",
        title: "Secretary of State",
        party: "Democratic",
        term_start: "2023-03-17",
        responsibilities: [
          "Maintains official state records",
          "Authenticates documents",
          "Oversees administrative filings",
        ],
        contact: {
          email: "sos@wisconsin.gov",
          phone: "608-266-8888",
          office: "30 West Mifflin St, Madison, WI 53703",
        },
      },
      {
        name: "John S. Leiber",
        title: "State Treasurer",
        party: "Republican",
        term_start: "2023-01-02",
        responsibilities: [
          "Manages state funds and investments",
          "Oversees unclaimed property",
          "Supports financial literacy programs",
        ],
        contact: {
          email: "treasurer@wisconsin.gov",
          phone: "608-266-1714",
          office: "1 South Pinckney St, Madison, WI 53703",
        },
      },
      {
        name: "Jill Underly",
        title: "Superintendent of Public Instruction",
        party: "Nonpartisan",
        term_start: "2021-07-05",
        term_end: "2025-07-07",
        responsibilities: [
          "Leads Wisconsin Department of Public Instruction",
          "Oversees K–12 education policy",
          "Implements statewide academic standards",
        ],
        contact: {
          email: "dpi@dpi.wi.gov",
          phone: "608-266-3390",
          office: "125 S Webster St, Madison, WI 53703",
        },
      },
      {
        name: "Kristina Boardman",
        title: "Secretary of Transportation",
        department: "Wisconsin Department of Transportation (WisDOT)",
        responsibilities: [
          "Leads statewide transportation planning and policy",
          "Oversees highway construction and maintenance",
          "Manages DMV services and vehicle registration",
          "Coordinates public transit, rail, and aviation programs",
        ],
        contact: {
          email: "dotexec@dot.wi.gov",
          phone: "608-266-1114",
          office: "4822 Madison Yards Way, Madison, WI 53707",
        },
      },
      {
        name: "Scott Lawry",
        title: "Deputy Secretary of Transportation",
        department: "Wisconsin Department of Transportation (WisDOT)",
        responsibilities: [
          "Supports strategic operations across WisDOT divisions",
          "Coordinates interagency transportation initiatives",
          "Assists in budget and policy development",
        ],
        contact: {
          email: "dotexec@dot.wi.gov",
          phone: "608-266-1114",
          office: "4822 Madison Yards Way, Madison, WI 53707",
        },
      },
      {
        name: "Joel Nilsestuen",
        title: "Assistant Deputy Secretary of Transportation",
        department: "Wisconsin Department of Transportation (WisDOT)",
        responsibilities: [
          "Advises on legislative and stakeholder engagement",
          "Supports infrastructure modernization efforts",
          "Oversees communications and outreach",
        ],
        contact: {
          email: "dotexec@dot.wi.gov",
          phone: "608-266-1114",
          office: "4822 Madison Yards Way, Madison, WI 53707",
        },
      },
    ]
  }

  getFederalOfficials() {
    return [
      {
        name: "Ron Johnson",
        title: "U.S. Senator (Senior)",
        party: "Republican",
        term_start: "2011-01-05",
        term_end: "2029-01-03",
        responsibilities: [
          "Represents Wisconsin in the U.S. Senate",
          "Votes on federal legislation",
          "Serves on Senate committees",
          "Advocates for Wisconsin interests at the national level",
        ],
        contact: {
          website: "https://www.ronjohnson.senate.gov",
          office: "328 Hart Senate Office Building, Washington, DC 20510",
        },
      },
      {
        name: "Tammy Baldwin",
        title: "U.S. Senator (Junior)",
        party: "Democratic",
        term_start: "2013-01-03",
        term_end: "2031-01-03",
        responsibilities: [
          "Represents Wisconsin in the U.S. Senate",
          "Votes on federal legislation",
          "Serves on Senate committees",
          "Advocates for Wisconsin interests at the national level",
        ],
        contact: {
          website: "https://www.baldwin.senate.gov",
          office: "709 Hart Senate Office Building, Washington, DC 20510",
        },
      },
      {
        name: "Donald J. Trump",
        title: "President of the United States",
        party: "Republican",
        term_start: "2025-01-20",
        responsibilities: [
          "Chief Executive of the federal government",
          "Commander-in-Chief of the Armed Forces",
          "Appoints federal officials and judges",
          "Signs or vetoes legislation",
          "Conducts foreign policy and treaties",
        ],
        contact: {
          website: "https://www.whitehouse.gov",
          office:
            "The White House, 1600 Pennsylvania Ave NW, Washington, DC 20500",
        },
      },
      {
        name: "J.D. Vance",
        title: "Vice President of the United States",
        party: "Republican",
        term_start: "2025-01-20",
        responsibilities: [
          "Presides over the U.S. Senate",
          "Casts tie-breaking votes in the Senate",
          "Supports presidential initiatives",
          "Assumes presidency if needed",
        ],
        contact: {
          website: "https://www.whitehouse.gov",
          office:
            "The White House, 1600 Pennsylvania Ave NW, Washington, DC 20500",
        },
      },
      {
        name: "Marco Rubio",
        title: "Secretary of State",
        department: "Department of State",
        responsibilities: [
          "Leads U.S. foreign policy",
          "Negotiates treaties and international agreements",
          "Represents U.S. abroad",
        ],
        contact: {
          website: "https://www.state.gov",
          office: "2201 C St NW, Washington, DC 20520",
        },
      },
      {
        name: "Peter Hegseth",
        title: "Secretary of Defense",
        department: "Department of Defense",
        responsibilities: [
          "Oversees U.S. military operations",
          "Advises President on defense policy",
          "Manages Pentagon and armed forces",
        ],
        contact: {
          website: "https://www.defense.gov",
          office: "The Pentagon, Washington, DC 20301",
        },
      },
      {
        name: "Scott Bessent",
        title: "Secretary of the Treasury",
        department: "Department of the Treasury",
        responsibilities: [
          "Manages federal finances",
          "Oversees IRS and currency production",
          "Advises on economic policy",
        ],
        contact: {
          website: "https://home.treasury.gov",
          office: "1500 Pennsylvania Ave NW, Washington, DC 20220",
        },
      },
      {
        name: "Pamela Bondi",
        title: "Attorney General",
        department: "Department of Justice",
        responsibilities: [
          "Chief law enforcement officer",
          "Oversees federal prosecutions",
          "Ensures fair and impartial justice",
        ],
        contact: {
          website: "https://www.justice.gov",
          office: "950 Pennsylvania Ave NW, Washington, DC 20530",
        },
      },
      {
        name: "Sean Duffy",
        title: "Secretary of Transportation",
        department: "Department of Transportation",
        responsibilities: [
          "Oversees national transportation systems",
          "Manages highway, rail, air, and transit policy",
          "Supports infrastructure development",
        ],
        contact: {
          website: "https://www.transportation.gov",
          office: "1200 New Jersey Ave SE, Washington, DC 20590",
        },
      },
      {
        name: "Kristi Noem",
        title: "Secretary of Homeland Security",
        department: "Department of Homeland Security",
        responsibilities: [
          "Leads national efforts on counterterrorism and border security",
          "Manages FEMA, TSA, and immigration enforcement",
          "Coordinates cybersecurity and emergency response",
        ],
        contact: {
          website: "https://www.dhs.gov",
          office: "245 Murray Lane SW, Washington, DC 20528",
        },
      },
      {
        name: "Robert F. Kennedy Jr.",
        title: "Secretary of Health and Human Services",
        department: "Department of Health and Human Services",
        responsibilities: [
          "Oversees public health agencies including CDC and FDA",
          "Manages Medicare and Medicaid",
          "Leads health policy and research initiatives",
        ],
        contact: {
          website: "https://www.hhs.gov",
          office: "200 Independence Ave SW, Washington, DC 20201",
        },
      },
      {
        name: "Linda McMahon",
        title: "Secretary of Education",
        department: "Department of Education",
        responsibilities: [
          "Oversees federal education policy and funding",
          "Supports K–12 and higher education programs",
          "Promotes school choice and vocational training",
        ],
        contact: {
          website: "https://www.ed.gov",
          office: "400 Maryland Ave SW, Washington, DC 20202",
        },
      },
    ]
  }
}
