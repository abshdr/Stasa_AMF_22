package com.stasa.configurations;

import com.stasa.entities.User;
import com.stasa.repositories.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class MyUserDetailsService implements UserDetailsService {

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    public BCryptPasswordEncoder getEncoder() { return encoder; }

    @Autowired
    private UserRepo userRepo;



//  Springs way of calling the constructor
//  @PostConstruct
//  private void createDefaultUsers(){
//    if (userRepo.findByUsername("user") == null) {
//      addUser("user", "password");
//    }
//  }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found by username: " + username);
        }
        return toUserDetails(user);
    }

    public User addUser(User user){
        // encrypt password before saving
        System.out.println(user);
        user.setPassword(encoder.encode(user.getPassword()));
        try {
            return userRepo.save(user); // skickar till db direkt.
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return null;
    }

    public User updateUser(User user){
        user.setPassword(encoder.encode(user.getPassword()));
        try {
            return userRepo.save(user);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return null;
    }

    private UserDetails toUserDetails(User user) {
        // If you have a User entity you have to
        // use the userdetails User for this to work
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .roles("USER").build();
    }
}