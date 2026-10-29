/* Customer-facing scope from the supplied VAS workbook, with confirmed campaign choices.
   Eligibility and selectable options remain controlled by the private Services sheet. */
window.SYMBO_SERVICE_CONTENT = {
  ac: {
    name: "AC Servicing",
    desc: "Dry cleaning or a deep Jet service for one AC unit.",
    note: "Choose one service for 1 AC. Repairs, gas refills and replacement parts are not included.",
    question: "Which AC service would you prefer?",
    sections: [
      {title:"Dry Servicing | included", items:["Washing of the air filter and indoor unit cover.","Dry brushing or vacuuming of cooling coils.","Cleaning of the outdoor unit panels.","Drain-pipe blockage check.","Gas-pressure and overall performance check."]},
      {title:"Dry Servicing | not included", items:["Deep coil washing with water, outdoor unit power washing and jet-pump cleaning.","Repair of broken components.","Gas top-ups or refills."]},
      {title:"Jet Servicing | included", items:["High-pressure jet cleaning of indoor cooling coils and the outdoor condenser unit.","Deep cleaning of the drain tray and drain pipe.","Clean-up using an AC jacket splash guard."]},
      {title:"Jet Servicing | conditional inclusion", items:["Foam or chemical washing for stubborn dirt is listed for premium plans only. Your concierge will confirm whether it is included in your booking before the service."]},
      {title:"Jet Servicing | not included", items:["AC gas charging or leakage repair.","Spare-part replacements, including capacitors and PCBs.","Copper-pipe repairs or insulation wrapping.","Dismantling or re-installing AC units."]},
      {title:"Before you book", items:["The privilege covers one Dry or one Jet service for a single AC, not both.","Excluded work requires additional charges and confirmation before booking."]}
    ]
  },
  clean: {
    name: "Home Cleaning",
    desc: "Deep cleaning of rooms, kitchen, bathrooms and balconies in a 1 or 2 BHK home.",
    note: "Symbo covers the 2 BHK service. For 3 BHK or larger, your concierge will quote the additional amount before booking.",
    question: "What size is your home?",
    sections: [
      {title:"Rooms | included", items:["Mechanised floor scrubbing, wet mopping and deep vacuuming in living rooms, bedrooms and dining areas.","Dry vacuuming of sofas, carpets and curtains.","Dusting and wiping of fans, tube lights, switchboards and doors.","Scrubbing and wiping of reachable window glass, meshes and grills."]},
      {title:"Kitchen | included", items:["Degreasing of the exhaust fan, chimney exterior, gas stove and wall tiles.","Deep cleaning of countertops, sinks, slabs and outer appliance surfaces.","Wiping of cabinet exteriors. Cabinet interiors are cleaned only if completely empty."]},
      {title:"Bathrooms, balconies and utility areas | included", items:["Hard-water stain removal from bathroom wall tiles, floors, sinks and taps.","Disinfection of the toilet bowl, shower area and bathtub.","Hard-water stain removal from mirrors, glass partitions and chrome fittings.","Sweeping, washing and scrubbing of balcony floors and railings."]},
      {title:"Not included", items:["Washing or handling kitchen utensils, dishes or cookware.","Wet washing or scrubbing of painted walls and structural ceilings, to avoid paint damage.","Crystal shining, marble grinding, or specialised stone or terrazzo floor polishing.","Wet shampooing of sofas, chairs, mattresses, carpets or window blinds.","Oil or wax polishing of wooden tables, cupboards or doors."]},
      {title:"Before you book", items:["The complimentary benefit covers a 1 or 2 BHK home. For 3 BHK or larger, Symbo covers the 2 BHK service and your concierge will quote the additional amount before booking.","Only reachable window surfaces are covered. Empty cabinets before the visit if you want their interiors cleaned."]}
    ]
  },
  pest: {
    name: "Home Pest Control",
    desc: "One general pest-control visit for common household pests in a 1 or 2 BHK home.",
    note: "One visit only; no AMC. Symbo covers the 2 BHK service. For 3 BHK or larger, your concierge will quote the additional amount before booking.",
    question: "What size is your home?",
    sections: [
      {title:"Pests covered", items:["Common cockroaches; black and red ants; house lizards (geckos); spiders and silverfish."]},
      {title:"Areas and treatments included", items:["Full-home coverage, including kitchen and bathroom cabinets, skirting boards, wall perimeters, and main entry and exit thresholds.","General pest-control methods include odourless gel baiting, residual surface sprays, insect bait stations and routine protective barriers."]},
      {title:"Pests not covered", items:["Termites (white ants), bed bugs, rodents (rats and mice), wood borers and mosquitoes require specialised services."]},
      {title:"Areas and treatments not included", items:["Deep sub-soil drilling and building-foundation treatment.","External lawn or yard spraying and overhead roof or ceiling voids.","Chemical soil injection, heat or steam treatments, and heavy-duty rodent trapping or baiting."]},
      {title:"Visits, guarantees and charges", items:["This Diwali benefit is one visit only. An annual maintenance contract (AMC) is not included.","Mandatory multi-visit schedules and structural guarantees of 1 to 5+ years are not included.","For 3 BHK or larger, Symbo covers the 2 BHK service and your concierge will quote the additional amount before booking.","Excluded pests or treatments require a separate specialised service; ask your concierge about scope and charges."]}
    ]
  },
  shoe: {
    name: "Shoe Cleaning",
    desc: "Material-specific cleaning and care for one pair, including designer sneakers.",
    note: "One pair only. The cleaning method and exclusions depend on the shoe material.",
    question: "What type of shoes would you like cleaned?",
    sections: [
      {title:"Canvas / Mesh Sneakers | included", items:["Complete deep hand or machine washing, outer-sole scrubbing, standard deodorisation and drying."]},
      {title:"Canvas / Mesh Sneakers | not included", items:["Permanent ink or oil stain removal, sole unyellowing or bleaching, and replacement of damaged laces."]},
      {title:"Suede / Nubuck Shoes | included", items:["Specialised dry chemical cleaning, delicate nap brushing and texture renewal, and basic salt or water stain treatment."]},
      {title:"Suede / Nubuck Shoes | not included", items:["Complete re-dyeing or colour restoration, scuff and scratch repairs, and water-repellent protective coatings."]},
      {title:"Leather Boots / Formals | included", items:["Surface dirt removal, leather conditioning and cream polishing, and upper crease smoothing."]},
      {title:"Leather Boots / Formals | not included", items:["Deep leather scratch or scuff repair, sole replacement or cobbler stitching, and inner-lining replacement."]},
      {title:"Luxury / Designer Sneakers | included", items:["Detailed, delicate hand scrubbing, premium sole whitening, and deep cleaning of insoles and laces."]},
      {title:"Luxury / Designer Sneakers | not included", items:["Midsole repainting or customisation, major structural restoration, and hardware or metal-eyelet replacement."]},
      {title:"Before you book", items:["The benefit covers one pair in one of the categories above. Excluded work requires extra charges or a special booking, confirmed with your concierge."]}
    ]
  },
  wash: {
    name: "Car Wash",
    desc: "An exterior foam wash with wax or an interior spa for one car.",
    note: "Choose one package for 1 car, not both. Package-specific exclusions and additional charges apply.",
    question: "Which car-care package would you prefer?",
    sections: [
      {title:"Exterior Foam Wash & Wax | included", items:["Exterior high-pressure water washing, comprehensive outer-body foam washing and wax.","Tyre surface wiping and basic tyre gloss.","Microfibre towel drying of the body.","Underbody water spray.","Dry cabin vacuuming of seats, floors and boot.","Dashboard and trim dressing."]},
      {title:"Exterior Foam Wash & Wax | not included", items:["Hydraulic underbody cleaning (distinct from the included underbody water spray).","Engine-bay degreasing.","Floor-mat cleaning.","Preparation fees for heavily soiled or muddy vehicles.","In-depth fabric upholstery shampooing.","Rubbing-compound treatment or scratch removal."]},
      {title:"Interior Spa / Deep Cleaning | included", items:["Full-cabin wet vacuuming and disinfection.","Upholstery shampooing and seat-spot removal.","Deep cleaning of the roof liner and floor carpet.","AC-vent sanitisation and odour neutralisation."]},
      {title:"Interior Spa / Deep Cleaning | not included", items:["Exterior paint correction or polishing.","Specialised leather-seat nourishment coatings.","Engine-room detailing."]},
      {title:"Before you book", items:["The privilege covers one Exterior Foam Wash & Wax or one Interior Spa for a single car, not both.","Excluded work and applicable preparation fees are additional; your concierge will confirm the scope and charges before booking."]}
    ]
  }
};
