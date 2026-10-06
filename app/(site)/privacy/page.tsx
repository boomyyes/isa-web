import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "How the ISA-RAIT Student Chapter processes personal data under the Digital Personal Data Protection Act, 2023: what we collect, why, who processes it, how long it is kept, and your rights.",
  }),
};

const CONTACT = "isa.rait@rait.ac.in";
const PORTAL = "https://isa-web-six.vercel.app/data-request";

const Mail = () => <a href={`mailto:${CONTACT}`}>{CONTACT}</a>;
const Portal = () => <a href={PORTAL}>{PORTAL}</a>;

function Address() {
  return (
    <p>
      ISA-RAIT Student Chapter
      <br />
      Ramrao Adik Institute of Technology
      <br />
      D. Y. Patil University
      <br />
      Sector 7, Nerul
      <br />
      Navi Mumbai 400706
      <br />
      Maharashtra, India
    </p>
  );
}

// Text adopted from the chapter's approved policy document (PRIVACY POLICY.pdf).
// Keep the two in sync, and change both dates whenever the substance changes.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" effective="9 September 2026" updated="9 September 2026">
      <h2>1. Identity of the Data Fiduciary</h2>
      <p>
        This Website (&ldquo;Website&rdquo;) is operated by the ISA-RAIT Student Chapter, the
        student chapter of the International Society of Automation at Ramrao Adik Institute of
        Technology, D. Y. Patil University, Navi Mumbai (&ldquo;ISA-RAIT&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
      </p>
      <p>
        For the purposes of the Digital Personal Data Protection Act, 2023 (&ldquo;DPDP
        Act&rdquo;), ISA-RAIT acts as the Data Fiduciary in respect of the personal data processed
        by us as described in this Privacy Policy.
      </p>
      <p>
        ISA-RAIT determines the purposes for which such personal data is processed and the manner
        in which such processing is carried out, subject to applicable law.
      </p>
      <p>ISA-RAIT is a student chapter and is not a company or separate corporate entity.</p>
      <p>
        <strong>Organisational details:</strong>
      </p>
      <Address />
      <p>
        <strong>Email:</strong> <Mail />
      </p>
      <p>
        Responsibility for the processing of personal data described in this Privacy Policy rests
        with ISA-RAIT Student Chapter as the Data Fiduciary. ISA-RAIT does not designate a
        separate individual or office solely for data-protection matters.
      </p>

      <h2>2. Scope and applicability</h2>
      <p>
        This Privacy Policy applies to personal data processed by ISA-RAIT in connection with:
      </p>
      <ul>
        <li>the Website;</li>
        <li>certificate access and verification;</li>
        <li>workshop and event participation;</li>
        <li>Artemis Hackathon registration;</li>
        <li>support and enquiry submissions;</li>
        <li>membership registration;</li>
        <li>membership and committee applications;</li>
        <li>payment and refund administration associated with Website-based activities;</li>
        <li>communications associated with the foregoing activities; and</li>
        <li>other services or functionalities expressly provided through the Website.</li>
      </ul>
      <p>
        This Privacy Policy describes the categories of personal data processed by ISA-RAIT, the
        purposes for which such personal data is processed, the entities that may process such
        data, applicable retention practices, security measures, and the rights available to Data
        Principals under applicable law.
      </p>

      <h2>3. Categories of personal data processed</h2>
      <p>
        ISA-RAIT follows the principle of data minimisation and processes personal data only to
        the extent reasonably necessary for a specified purpose.
      </p>
      <p>
        ISA-RAIT does not operate advertising systems, behavioural-profiling systems, analytics
        packages, or cross-site tracking systems.
      </p>
      <p>
        The categories of personal data processed depend upon the service or functionality with
        which you interact.
      </p>

      <h3>3.1 Workshop attendance and certification records</h3>
      <p>
        For workshops and other activities for which attendance and certification records are
        maintained, ISA-RAIT may process:
      </p>
      <ul>
        <li>Unique Identification Number (UID);</li>
        <li>name;</li>
        <li>college or institution;</li>
        <li>email address; and</li>
        <li>details of the workshop or activity attended.</li>
      </ul>
      <p>
        Such information is obtained through the applicable attendance records and is used for
        participation administration, certification, and certificate verification.
      </p>

      <h3>3.2 Certificate authentication and access</h3>
      <p>
        The Website provides certificate-access functionality through which a user may be required
        to provide a UID and access code.
      </p>
      <p>
        The submitted access code is processed solely for authentication and certificate
        retrieval.
      </p>
      <p>
        The access code is not stored in its original form and is discarded following the
        authentication process.
      </p>
      <p>
        Certificate files may contain the certificate holder&apos;s name and other information
        necessary for the certificate.
      </p>

      <h3>3.3 Artemis Hackathon registration</h3>
      <p>
        The Artemis Hackathon registration form is hosted and processed through a third-party
        online form service.
      </p>
      <p>Depending on the applicable registration form, applicants may be required to provide:</p>
      <ul>
        <li>name;</li>
        <li>email address;</li>
        <li>contact number;</li>
        <li>college or institution;</li>
        <li>team or participant information;</li>
        <li>hackathon registration information;</li>
        <li>proof of payment or transaction confirmation; and</li>
        <li>other information specifically requested by the registration form.</li>
      </ul>
      <p>
        A submitted proof of payment may contain information appearing in the relevant screenshot
        or document, including transaction identifiers, UPI identifiers, payment-application
        information, or other transaction-related information.
      </p>
      <p>Such information is processed for the purposes of:</p>
      <ul>
        <li>processing and verifying hackathon registrations;</li>
        <li>verifying applicable registration payments;</li>
        <li>administering participation;</li>
        <li>communicating registration-related information;</li>
        <li>processing refunds where applicable; and</li>
        <li>maintaining necessary event records.</li>
      </ul>
      <p>
        Applicants should not voluntarily submit information that is not required for the
        relevant registration process.
      </p>

      <h3>3.4 Support and enquiry submissions</h3>
      <p>
        The Website provides a Support/Query form hosted through a third-party online form
        service.
      </p>
      <p>Information submitted through this form may include:</p>
      <ul>
        <li>name;</li>
        <li>email address;</li>
        <li>contact information, where requested;</li>
        <li>the contents of the enquiry or communication; and</li>
        <li>any additional information or attachments voluntarily submitted.</li>
      </ul>
      <p>
        Such information is processed for the purpose of responding to and managing the relevant
        enquiry or request.
      </p>

      <h3>3.5 Membership registration</h3>
      <p>
        The Membership Registration form is operated through a third-party online form service and is used to
        facilitate an applicant&apos;s membership with the International Society of Automation.
      </p>
      <p>Depending on the applicable form, information collected may include:</p>
      <ul>
        <li>name;</li>
        <li>email address;</li>
        <li>contact number;</li>
        <li>college or institution;</li>
        <li>academic information;</li>
        <li>membership-related information;</li>
        <li>account information;</li>
        <li>payment or membership-related information; and</li>
        <li>
          an account password where such credential information is required to complete the
          membership process on the applicant&apos;s behalf.
        </li>
      </ul>

      <h3>3.5.1 Processing of account credentials</h3>
      <p>
        When an applicant requests assistance from ISA-RAIT in obtaining or activating membership
        and the applicable process requires an account password, the applicant may be requested
        to provide such password.
      </p>
      <p>
        An account password constitutes confidential authentication information and is processed
        solely for the purpose of completing the specified membership process.
      </p>
      <p>The password:</p>
      <ol>
        <li>shall not be used for any purpose unrelated to the membership process;</li>
        <li>shall not be used for marketing, profiling, or unrelated activities;</li>
        <li>
          shall not be intentionally retained after completion of the relevant membership
          process;
        </li>
        <li>
          shall not be disclosed to persons who do not require access for the relevant membership
          process; and
        </li>
        <li>
          shall be deleted from records under ISA-RAIT&apos;s control as soon as reasonably
          practicable following completion of the relevant process.
        </li>
      </ol>
      <p>
        Upon completion of the membership process, the applicant shall be instructed to change
        the relevant account password.
      </p>
      <p>Applicants are advised not to reuse passwords across different services.</p>

      <h3>3.6 IP address and technical security information</h3>
      <p>
        When certificate sign-in or access-code reset functionality is used, the Website may
        temporarily process the user&apos;s IP address.
      </p>
      <p>
        Such information is processed solely for security purposes, including rate-limiting, abuse
        prevention, and detection of repeated or automated authentication attempts.
      </p>
      <p>IP-address counters are automatically discarded within approximately one hour.</p>

      <h2>4. Purposes of processing</h2>
      <p>ISA-RAIT processes personal data only for specified and legitimate purposes.</p>

      <h3>4.1 Workshop and certificate administration</h3>
      <p>Workshop attendance and certification information is processed to:</p>
      <ul>
        <li>verify participation;</li>
        <li>issue certificates;</li>
        <li>facilitate certificate access and verification; and</li>
        <li>maintain reasonable records of participation.</li>
      </ul>

      <h3>4.2 Certificate authentication</h3>
      <p>
        UIDs and access codes are processed to authenticate authorised users and provide access to
        the relevant certificate.
      </p>

      <h3>4.3 Electronic communications</h3>
      <p>Email addresses may be used to:</p>
      <ul>
        <li>deliver certificate access codes;</li>
        <li>provide access-code reset links where requested; and</li>
        <li>
          communicate information necessary for the specific service or request for which the
          email address was provided.
        </li>
      </ul>
      <p>ISA-RAIT does not operate a general promotional mailing list using these addresses.</p>

      <h3>4.4 Artemis Hackathon administration</h3>
      <p>
        Information submitted through the Artemis Hackathon registration form is processed to:
      </p>
      <ul>
        <li>process registrations;</li>
        <li>verify applicable payments;</li>
        <li>administer participation;</li>
        <li>communicate with participants;</li>
        <li>process applicable refunds; and</li>
        <li>maintain necessary event records.</li>
      </ul>

      <h3>4.5 Support and enquiry management</h3>
      <p>
        Information submitted through the Support/Query form is processed to respond to and manage
        enquiries and requests.
      </p>

      <h3>4.6 Membership administration</h3>
      <p>Information submitted through the Membership Registration form is processed to:</p>
      <ul>
        <li>process membership requests;</li>
        <li>facilitate membership;</li>
        <li>verify applicable registration or payment information;</li>
        <li>complete the membership process where assistance has been requested;</li>
        <li>communicate with applicants; and</li>
        <li>maintain necessary membership records.</li>
      </ul>
      <p>
        Where an account password is temporarily provided, it is processed solely for completion
        of the relevant membership process.
      </p>

      <h3>4.7 Payment and refund administration</h3>
      <p>
        Where the Website facilitates the collection of registration fees or other payments in
        connection with an ISA-RAIT event or activity, payment-related information may be
        processed for purposes including:
      </p>
      <ul>
        <li>registration and payment verification;</li>
        <li>transaction reconciliation;</li>
        <li>event administration;</li>
        <li>accounting and record-keeping;</li>
        <li>processing refunds where applicable; and</li>
        <li>communicating with participants regarding payments or refunds.</li>
      </ul>
      <p>
        A refund shall be issued only where ISA-RAIT cancels the relevant event for which payment
        was collected through the Website.
      </p>
      <p>No refund shall be provided solely because a participant:</p>
      <ul>
        <li>wishes to cancel their registration;</li>
        <li>is unable or unwilling to attend the event;</li>
        <li>requests cancellation of their registration; or</li>
        <li>otherwise requests a refund without cancellation of the event by ISA-RAIT.</li>
      </ul>
      <p>
        Where ISA-RAIT cancels an event for which payment has been collected through the Website,
        the amount collected for the cancelled event shall be refunded to the respective
        participant through the same mode or payment method through which the original payment
        was made, subject to the processing requirements and limitations of the applicable
        payment service.
      </p>
      <p>
        Personal data reasonably necessary to identify the relevant transaction and process the
        applicable refund may be used for this purpose.
      </p>
      <p>
        ISA-RAIT shall not use payment-related personal data for advertising, profiling, or
        unrelated purposes.
      </p>

      <h3>4.8 Information security</h3>
      <p>
        Temporary technical information, including IP addresses, is processed to protect
        authentication functionality, prevent abuse, and implement reasonable security controls.
      </p>

      <h2>5. Lawful basis for processing</h2>
      <p>
        ISA-RAIT shall process personal data only for a lawful purpose permitted under applicable
        law.
      </p>
      <p>
        Where consent is relied upon as the basis for processing, consent shall be obtained
        through a clear affirmative action after the relevant information concerning the
        processing has been made available.
      </p>
      <p>
        Where applicable, consent shall be free, specific, informed, unconditional, and
        unambiguous.
      </p>

      <h3>5.1 Processing based on consent</h3>
      <p>
        Where a form or service relies upon consent, the relevant notice and consent mechanism
        shall be presented at or before the point at which personal data is submitted.
      </p>
      <p>
        A Data Principal may withdraw consent where consent constitutes the applicable basis for
        processing.
      </p>
      <p>
        The mechanism for withdrawing consent shall be reasonably comparable in ease to the
        mechanism through which consent was provided.
      </p>
      <p>
        Withdrawal of consent may affect ISA-RAIT&apos;s ability to provide the service or
        complete the activity for which the personal data was collected.
      </p>

      <h3>5.2 Workshop and certification records</h3>
      <p>
        Workshop attendance and certification records are processed for the specified purposes
        communicated in connection with the relevant activity, including administration of
        participation, issuance of certificates, and maintenance of reasonable participation
        records.
      </p>
      <p>
        A request for deletion may affect the availability, verification, or reissuance of the
        associated certificate.
      </p>

      <h2>6. Third-party data processors and service providers</h2>
      <p>
        ISA-RAIT does not sell personal data and does not disclose personal data to third parties
        for their own advertising or marketing purposes.
      </p>
      <p>Certain Website functions rely upon third-party technology and service providers.</p>
      <p>The categories of service providers currently used are:</p>
      <ul>
        <li>
          <strong>Website hosting.</strong> Categories of information: technical information,
          including IP addresses. Purpose: serving the Website and its functionality.
        </li>
        <li>
          <strong>Email and document services.</strong> Categories of information: workshop
          attendance records and relevant email information. Purpose: attendance records and
          certificate-related communications.
        </li>
        <li>
          <strong>Online form services.</strong> Categories of information: membership and
          committee-application information, Artemis registration information, payment proof, and
          Support/Query submissions. Purpose: hosting and processing the relevant forms.
        </li>
        <li>
          <strong>Database services.</strong> Categories of information: UID, name, college, email,
          and attendance information. Purpose: database infrastructure supporting the certificate
          portal.
        </li>
        <li>
          <strong>Cloud file storage.</strong> Categories of information: certificate files.
          Purpose: private storage and certificate-file delivery.
        </li>
      </ul>
      <p>
        A Data Principal may request the identities of the Data Processors with whom their
        personal data has been shared, in accordance with the DPDP Act, through the channels in
        Section 11.
      </p>
      <p>
        Third-party service providers may process technical information, including IP addresses,
        when their services are accessed or loaded.
      </p>
      <p>
        To reduce unnecessary third-party processing, embedded third-party forms are not loaded
        until the user affirmatively chooses to load the relevant form.
      </p>
      <p>
        Third-party providers may process information in jurisdictions outside India. Any such
        processing or transfer shall be subject to applicable law and any restrictions or
        requirements applicable to transfers of personal data outside India.
      </p>
      <p>
        Users should review the applicable privacy policies and terms of the relevant third-party
        service providers.
      </p>

      <h2>7. QR codes and linked destinations</h2>
      <p>
        The Website may display QR codes that direct users to registration forms,
        certificate-access pages, payment facilities, membership services, event resources,
        external websites, or other digital destinations.
      </p>
      <p>
        A QR code itself does not necessarily collect personal data. However, the destination to
        which a QR code directs the user may process personal data.
      </p>
      <p>
        Where a QR code directs a user to a service operated by ISA-RAIT, the processing of
        personal data on that destination shall be governed by this Privacy Policy to the extent
        applicable.
      </p>
      <p>
        Where a QR code directs a user to a third-party website, application, payment service,
        registration system, or other external platform, any personal data subsequently provided
        or automatically processed by that third party shall be governed by the relevant third
        party&apos;s privacy policy and terms.
      </p>
      <p>
        ISA-RAIT does not control the privacy or security practices of third-party destinations
        accessed through QR codes.
      </p>
      <p>
        Users should verify the destination of a QR code before providing personal data, payment
        information, credentials, or other information.
      </p>

      <h2>8. Disclosure pursuant to law</h2>
      <p>ISA-RAIT may disclose personal data where such disclosure is:</p>
      <ul>
        <li>required by applicable law;</li>
        <li>
          required pursuant to a lawful order, direction, or request of a competent authority;
        </li>
        <li>necessary to comply with a legal obligation; or</li>
        <li>otherwise permitted under applicable law.</li>
      </ul>
      <p>
        Where legally permissible, ISA-RAIT shall make reasonable efforts to inform the affected
        Data Principal of such disclosure.
      </p>
      <p>
        No such notification shall be provided where notification is prohibited by applicable law
        or by a lawful direction of a competent authority.
      </p>

      <h2>9. Retention of personal data</h2>
      <p>
        ISA-RAIT shall retain personal data only for as long as reasonably necessary to fulfil the
        specified purpose for which it was collected, maintain necessary records, address disputes
        or requests, protect the Website and its users, or where retention is otherwise required
        or permitted by applicable law.
      </p>
      <p>The current retention periods are:</p>
      <ul>
        <li>
          <strong>Workshop roster records and certificate files:</strong> three years following
          the last workshop attended through ISA-RAIT.
        </li>
        <li>
          <strong>Support and enquiry records:</strong> one year.
        </li>
        <li>
          <strong>Event and membership registration records:</strong> one year following the
          relevant event or activity.
        </li>
        <li>
          <strong>IP-address counters used for rate-limiting:</strong> less than one hour,
          automatically.
        </li>
        <li>
          <strong>Records relating to access or processing activity:</strong> one year.
        </li>
        <li>
          <strong>Account passwords temporarily provided for membership processing:</strong>{" "}
          deleted as soon as reasonably practicable following completion of the relevant
          membership process.
        </li>
        <li>
          <strong>Payment and refund records:</strong> retained for the period reasonably
          necessary for transaction verification, reconciliation, refund administration,
          accounting, and applicable legal requirements.
        </li>
      </ul>
      <p>
        Where a Data Principal requests erasure, ISA-RAIT shall cease processing the relevant
        personal data for the applicable purpose and delete it where deletion is appropriate and
        legally permissible.
      </p>
      <p>
        Certain limited information may nevertheless be retained where retention is required by
        law, necessary to establish compliance, or necessary for the exercise or defence of legal
        rights.
      </p>
      <p>Such information shall not be used for unrelated purposes.</p>
      <p>
        Electronic communications already delivered to a recipient may remain in the
        recipient&apos;s mailbox or within the applicable email service. ISA-RAIT cannot recall or
        delete an email from a recipient&apos;s personal mailbox after delivery.
      </p>

      <h2>10. Rights of Data Principals</h2>
      <p>
        Subject to applicable law, a Data Principal may exercise rights in relation to personal
        data processed by ISA-RAIT, including:
      </p>

      <h3>10.1 Right to access information</h3>
      <p>
        The right to obtain information concerning the personal data processed by ISA-RAIT and
        applicable processing activities.
      </p>

      <h3>10.2 Right to correction and updating</h3>
      <p>
        The right to request correction, completion, or updating of personal data that is
        inaccurate, incomplete, or outdated.
      </p>

      <h3>10.3 Right to erasure</h3>
      <p>
        The right to request erasure of personal data, subject to circumstances in which retention
        is required or permitted under applicable law.
      </p>
      <p>
        Erasure of certificate-related records may result in the inability to access, verify, or
        reissue the associated certificate.
      </p>

      <h3>10.4 Right to grievance redressal</h3>
      <p>
        The right to raise a grievance concerning the processing of personal data or the exercise
        of applicable rights.
      </p>

      <h3>10.5 Right to nominate</h3>
      <p>
        The right, subject to applicable law and prescribed procedures, to nominate another
        individual to exercise applicable rights in the event of death or incapacity.
      </p>

      <h2>11. Exercise of rights and grievance redressal</h2>
      <p>
        Data Principals may submit requests concerning access, correction, updating, erasure,
        withdrawal of consent, or other applicable rights through the ISA-RAIT Data Request
        Portal:
      </p>
      <p>
        <strong>Data Request Portal:</strong> <Portal />
      </p>
      <p>
        Questions or grievances concerning the processing of personal data may also be
        communicated to ISA-RAIT Student Chapter through:
      </p>
      <p>
        <strong>Email:</strong> <Mail />
      </p>
      <p>
        Requests and grievances received through these channels shall be reviewed and addressed by
        ISA-RAIT Student Chapter in accordance with applicable law.
      </p>
      <p>
        Requests should contain sufficient information to enable ISA-RAIT to understand and
        process the request and, where reasonably necessary, verify the identity of the
        requesting Data Principal.
      </p>
      <p>
        ISA-RAIT aims to respond to grievances within 30 days, or within such other period as may
        be prescribed under applicable law.
      </p>
      <p>
        Where applicable law provides a statutory mechanism for escalation of an unresolved
        grievance, the Data Principal may exercise such mechanism in accordance with the
        applicable law and procedure.
      </p>

      <h2>12. Technical and organisational security measures</h2>
      <p>
        ISA-RAIT implements reasonable technical and organisational measures appropriate to the
        nature of the personal data processed and the risks associated with such processing.
      </p>
      <p>Current safeguards include:</p>
      <ul>
        <li>
          Access codes are stored using a one-way, deliberately slow cryptographic hashing
          mechanism.
        </li>
        <li>
          Original access codes cannot be retrieved by committee members from the stored
          representation.
        </li>
        <li>
          Certificate files are stored in private storage and are not publicly listed or directly
          linkable.
        </li>
        <li>
          Certificate downloads are provided through time-limited links that expire after
          approximately two minutes.
        </li>
        <li>Certificate sign-in responses are designed not to disclose whether a particular UID exists.</li>
        <li>Certificate sign-in and access-code reset functionality is subject to rate-limiting.</li>
        <li>
          Pages displaying personal information are configured to discourage caching by browsers
          and intermediary systems.
        </li>
        <li>The Website is served using HTTPS.</li>
        <li>
          Access to membership credentials is restricted to persons authorised to process the
          relevant membership request.
        </li>
        <li>
          Account passwords temporarily provided for membership processing are not intentionally
          retained after completion of the relevant process.
        </li>
      </ul>
      <p>No electronic system can be guaranteed to be completely secure.</p>
      <p>
        Accordingly, although ISA-RAIT implements reasonable safeguards, it cannot guarantee that
        unauthorised access, disclosure, alteration, loss, or destruction can never occur.
      </p>
      <p>
        In the event of a personal-data breach, ISA-RAIT shall take appropriate containment,
        investigation, mitigation, and notification measures in accordance with applicable law.
      </p>

      <h2>13. Cookies, local storage and similar technologies</h2>
      <p>
        The Website does not set first-party cookies for advertising, behavioural tracking, or
        analytics.
      </p>
      <p>ISA-RAIT does not operate an analytics or advertising-tracking system.</p>
      <p>
        The Website may store limited preference information locally in the user&apos;s browser,
        including:
      </p>
      <ul>
        <li>the user&apos;s selected light or dark theme; and</li>
        <li>whether the user has previously chosen to load an embedded third-party form.</li>
      </ul>
      <p>
        Such browser-local information remains on the user&apos;s device and is not used by
        ISA-RAIT to identify or profile the user.
      </p>
      <p>
        Such information may generally be removed by clearing the browser&apos;s stored Website
        data.
      </p>
      <p>
        When a third-party form is loaded, the relevant third-party provider may use its own
        cookies, local storage, or similar technologies. Such technologies are controlled by the
        relevant provider and are subject to that provider&apos;s privacy practices.
      </p>

      <h2>14. Processing of personal data relating to minors</h2>
      <p>
        ISA-RAIT&apos;s workshops, events, and membership activities are intended primarily for
        college students and other eligible participants.
      </p>
      <p>
        Where applicable, registration processes require participants to confirm that they are 18
        years of age or older.
      </p>
      <p>
        ISA-RAIT does not knowingly seek to collect personal data from individuals below 18 years
        of age through the Website.
      </p>
      <p>
        If ISA-RAIT becomes aware that personal data relating to an individual below 18 years of
        age has been collected without the applicable lawful basis or consent required by law,
        ISA-RAIT shall take appropriate steps in accordance with applicable law.
      </p>

      <h2>15. External websites and third-party services</h2>
      <p>
        The Website may contain hyperlinks, embedded services, QR codes, registration facilities,
        payment facilities, or other mechanisms that direct users to third-party websites,
        applications, platforms, or services.
      </p>
      <p>
        Once a user accesses a third-party service, the privacy policy, terms, and data-processing
        practices of that third party shall apply to processing undertaken by that third party.
      </p>
      <p>
        ISA-RAIT does not control and is not responsible for the privacy or security practices of
        third-party services that it does not operate.
      </p>
      <p>
        Users are advised to review the applicable privacy policy and terms of any third-party
        service before providing personal data.
      </p>

      <h2>16. Amendments to this Privacy Policy</h2>
      <p>ISA-RAIT may amend this Privacy Policy from time to time to reflect:</p>
      <ul>
        <li>changes to the Website or its functionality;</li>
        <li>changes to the categories of personal data processed;</li>
        <li>changes to the purposes of processing;</li>
        <li>changes to service providers;</li>
        <li>changes in applicable law or regulatory requirements; or</li>
        <li>changes to privacy and security practices.</li>
      </ul>
      <p>
        The Effective Date and Last Updated date displayed at the beginning of this Privacy Policy
        shall be updated whenever an amendment is made.
      </p>
      <p>
        Where a material amendment affects the processing of personal data already held by
        ISA-RAIT and an appropriate means of contacting the affected Data Principal is available,
        additional notice may be provided where required or appropriate.
      </p>

      <h2>17. Governing law</h2>
      <p>
        This Privacy Policy shall be governed by and construed in accordance with the laws of
        India, including the Digital Personal Data Protection Act, 2023 and applicable rules and
        regulations made thereunder.
      </p>
      <p>
        Nothing contained in this Privacy Policy shall operate to exclude, restrict, or waive any
        right or remedy that cannot lawfully be excluded, restricted, or waived.
      </p>

      <h2>18. Contact information</h2>
      <p>
        For enquiries concerning this Privacy Policy, requests concerning personal data,
        withdrawal of consent, or grievances relating to the processing of personal data,
        communications may be submitted to:
      </p>
      <Address />
      <p>
        <strong>Email:</strong> <Mail />
      </p>
      <p>
        <strong>Data Request Portal:</strong> <Portal />
      </p>
    </LegalPage>
  );
}
